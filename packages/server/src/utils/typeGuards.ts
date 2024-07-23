import { ClientBenchmarkPostPayload } from '@haski/ta-lib'

export const isPayloadClientBenchmarkValid = (
  payload: unknown
): payload is ClientBenchmarkPostPayload => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'client_id' in payload &&
    'benchmark_id' in payload &&
    'benchmark_value' in payload
  )
}
