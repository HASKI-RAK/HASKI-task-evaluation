/* eslint-disable immutable/no-mutation */
import {
  handleToolRegistration,
  isPayloadToolRegistrationValid,
  ToolRegistrationRequest
} from '@haski/lti'
import {
  AnswerInputNode,
  assertIs,
  ClientBenchmarkPostPayload,
  LiteGraph,
  OutputNode,
  QuestionNode,
  ServerBenchmarkPostPayload
} from '@haski/ta-lib'
import { SampleSolutionNode } from '@haski/ta-lib/nodes/SampleSolutionNode'

import prisma from './client'
import { addOnNodeAdded, runLgraph } from './Graph'
import { log } from './server'
import { RestHandlerMap } from './utils/rest'
import { isPayloadClientBenchmarkValid } from './utils/typeGuards'

// Define your REST handlers
// always sanity check the payload before using it
export const handlers: RestHandlerMap<
  ClientBenchmarkPostPayload | ToolRegistrationRequest | undefined
> = {
  POST: {
    '/v1/benchmark': async (_, response, payload) => {
      assertIs(payload, isPayloadClientBenchmarkValid)
      const benchmarkPayload = payload
      const { path, data } = benchmarkPayload

      const graph = await prisma.graph.findFirst({
        where: {
          path
        }
      })

      if (!graph) {
        response.writeHead(404)
        response.end()
        return
      }

      const lgraph = new LiteGraph.LGraph()
      addOnNodeAdded(lgraph, undefined, true)
      lgraph.configure(JSON.parse(graph.graph))

      // Fill in the answer and question
      lgraph.findNodesByClass(AnswerInputNode).forEach((node) => {
        node.properties.value = data.answer
      })
      lgraph.findNodesByClass(QuestionNode).forEach((node) => {
        node.properties.value = data.question
      })
      lgraph.findNodesByClass(SampleSolutionNode).forEach((node) => {
        node.properties.value = data.realAnswer
      })

      // Run the graph
      runLgraph(lgraph).then(() => {
        const output: ServerBenchmarkPostPayload = lgraph
          .findNodesByClass(OutputNode)
          .map((node) => {
            return node.properties.value
          })
        log.debug('Benchmark post response: ', output)
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.write(JSON.stringify(output))
        response.end()
      })
    },
    '/v1/lti/register': async (_, response, payload) => {
      try {
        assertIs(payload, isPayloadToolRegistrationValid)

        // register the tool
        const registrationResult = handleToolRegistration(payload)
        log.debug('Tool registration response: ', registrationResult)
      } catch (e) {
        response.writeHead(400)
        response.end('Invalid Tool Registration Request')
      }
    }
  },
  GET: {
    '/v1/graphs': async (_, response) => {
      // getting all available graphs
      const graphs = await prisma.graph.findMany()
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
      response.write(JSON.stringify(graphs))
      response.end()
    },
    '/v1/lti/register': async (request, response) => {
      try {
        // get parameters from the request
        const params = new URLSearchParams(request.url?.split('?')[1])
        const openid_configuration = params.get('openid_configuration') // https://www.imsglobal.org/spec/lti-dr/v1p0#openid-configuration
        const registration_token = params.get('registration_token')
        log.debug('openid_configuration: ', openid_configuration)
        // visit with get request openID configuration endpoint to retreieve registration endpoint:
        const registration_endpoint = await getRegistrationEndpoint(
          openid_configuration,
          registration_token
        )
        response.writeHead(registration_endpoint.status, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
        // send post status: (window.opener || window.parent).postMessage({subject:'org.imsglobal.lti.close'}, '*')

        response.end(registration_endpoint.statusText)
        // assertIs(payload, isPayloadToolRegistrationValid)
        // register the tool
        // const registrationResult = handleToolRegistration(payload)
        // log.debug('Tool registration response: ', registrationResult)
      } catch (e) {
        response.writeHead(400, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
        response.end('Invalid Tool Registration Request')
      }
    },
    '/v1/lti/login': async (request, response) => {
      try {
        // get parameters from the request
        const params = new URLSearchParams(request.url?.split('?')[1])
        const id_token = params.get('id_token')
        const state = params.get('state')

        // visit with get request openID configuration endpoint to retreieve registration endpoint:
        const launch_response = await launchTool(id_token, state)
        log.debug('Launch response: ', launch_response)
        response.writeHead(launch_response.status)
        response.end(launch_response.statusText)
      } catch (e) {
        response.writeHead(400, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
        response.end('Invalid Tool Launch Request')
      }
    },
    '.well-known/jwks': async (_, response) => {
      const jwks = {
        kty: 'RSA',
        e: 'AQAB',
        use: 'sig',
        alg: 'RS256',
        n: 'hR3jOA4mku32gDGv34I3Zib6BnRXVN0rcVob0BO4TcAzD1awg7ROaKyK8jKPOR7O-0k4u4AyICbtVgcmm5kubgDAb7xVG4wtKxah4Dca2kWXuUIvzmq-s1olOv9_8DB0ZwaWOpi6o_Vji-GCq5_ZrD2vd0UKBlFRVMgvSo7aPU5yF6ai7gHX6nlk76PPubSfoZ4r8FKwCE46SPZdsFEmr-BYsOtlGEpVendLC5SGbAI7udhVSN026QOrqmiPIBYuFfMq05YVnROWutNriuIzGFAMzv5c2yvWuo_aBO3Y3_41hK8hnzZAP1bKbvktlc1vlytzqwiWU2DnekLVHlHcHQ'
      }
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
      response.write(JSON.stringify(jwks))
      response.end()
    }
  }
}

const getRegistrationEndpoint = async (
  openid_configuration: string | null,
  registration_token: string | null
) => {
  // visit with get request openID configuration endpoint to retreieve registration endpoint:
  if (openid_configuration) {
    const registration_endpoint = await fetch(openid_configuration)
    const registration_endpoint_json = await registration_endpoint.json()
    const registration_endpoint_url = registration_endpoint_json.registration_endpoint
    // visit registration_endpoint with post request to register the tool
    const registration_response = await fetch(registration_endpoint_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${registration_token}`
      },
      body: JSON.stringify({
        application_type: 'web',
        grant_types: ['client_credentials', 'implicit'],
        response_types: ['id_token'],
        client_name: 'Haski',
        'client_name#de': 'HASKI',
        redirect_uris: ['http://localhost:5000'],
        initiate_login_uri: 'http://localhost:5000/v1/lti/login',
        jwks_uri: 'http://localhost:5000/.well-known/jwks',
        token_endpoint_auth_method: 'private_key_jwt',
        scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/score',
        'https://purl.imsglobal.org/spec/lti-tool-configuration': {
          domain: 'http://localhost:5000',
          description: 'Haski',
          target_link_uri: 'http://localhost:5000',
          claims: ['iss', 'sub', 'name', 'given_name', 'family_name', 'email']
        }
      })
    })
    return registration_response
  } else {
    throw new Error('Invalid OpenID Configuration')
  }
}

const launchTool = async (id_token: string | null, state: string | null) => {
  // visit with get request openID configuration endpoint to retreieve registration endpoint:
  if (id_token) {
    // const decoded = jwt.decode(id_token, { complete: true })
    // log.debug('decoded: ', decoded)
    return { status: 200, statusText: 'OK' }
  } else {
    throw new Error('Invalid ID Token')
  }
}
