import { expect, test } from '@playwright/test'

type DebugBridge = {
  listNodes(): Array<{
    id: number
    title: string
    type: string
    properties: Record<string, unknown>
  }>
  addNode(type: string, position?: [number, number]): { id: number }
  selectNode(id: number): boolean
  setNodeProperty(id: number, property: string, value: unknown): boolean
  socketState(): { connected: boolean; id?: string }
  recentEvents(): Array<{ name: string; payload: unknown }>
  clearEvents(): void
  waitForEvent(eventName: string, timeoutMs?: number): Promise<unknown>
  runGraph(answer?: string): boolean
}

declare global {
  interface Window {
    __NODEGRADE_DEBUG__?: DebugBridge
  }
}

const modelUrl = `http://127.0.0.1:${process.env.NODEGRADE_DEBUG_MODEL_PORT ?? '18000'}`

test('deterministic model exposes the OpenAI-compatible contract', async ({
  request
}) => {
  const models = await request.get(`${modelUrl}/v1/models`)
  await expect(models).toBeOK()
  await expect(models.json()).resolves.toMatchObject({
    object: 'list',
    data: [{ id: 'nodegrade-deterministic' }]
  })

  const completion = await request.post(`${modelUrl}/v1/chat/completions`, {
    data: { model: 'nodegrade-deterministic', messages: [] }
  })
  await expect(completion).toBeOK()
  await expect(completion.json()).resolves.toMatchObject({
    choices: [
      { message: { content: 'score: 100\nfeedback: Deterministic debug response.' } }
    ]
  })
})

test('debug bridge inspects and controls the seeded canvas', async ({ page }) => {
  await page.goto('/ws/editor/debug/demo/1')
  await page.waitForFunction(() => window.__NODEGRADE_DEBUG__ !== undefined)
  await page.evaluate(() => window.__NODEGRADE_DEBUG__?.waitForEvent('graphLoaded'))

  await expect(page.locator('#mycanvas')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => window.__NODEGRADE_DEBUG__?.socketState().connected))
    .toBe(true)

  const initialNodes = await page.evaluate(() => window.__NODEGRADE_DEBUG__?.listNodes())
  expect(initialNodes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ title: 'Question', type: 'input/question' }),
      expect.objectContaining({ title: 'Answer Input', type: 'input/answer' })
    ])
  )

  const node = await page.evaluate(() => {
    const bridge = window.__NODEGRADE_DEBUG__
    if (bridge === undefined) throw new Error('Debug bridge unavailable')
    const created = bridge.addNode('basic/textfield', [720, 120])
    bridge.setNodeProperty(created.id, 'value', 'Playwright controlled this node')
    bridge.setNodeProperty(created.id, 'apiKey', 'debug-secret')
    bridge.selectNode(created.id)
    return created
  })

  const updatedNodes = await page.evaluate(() => window.__NODEGRADE_DEBUG__?.listNodes())
  expect(updatedNodes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: node.id,
        properties: expect.objectContaining({
          value: 'Playwright controlled this node',
          apiKey: '[Redacted]'
        })
      })
    ])
  )

  const started = await page.evaluate(() => {
    const bridge = window.__NODEGRADE_DEBUG__
    if (bridge === undefined) throw new Error('Debug bridge unavailable')
    bridge.clearEvents()
    return bridge.runGraph('Playwright answer')
  })
  expect(started).toBe(true)
  await page.evaluate(() => window.__NODEGRADE_DEBUG__?.waitForEvent('graphFinished'))

  const eventNames = await page.evaluate(() =>
    window.__NODEGRADE_DEBUG__?.recentEvents().map((event) => event.name)
  )
  expect(eventNames).toEqual(
    expect.arrayContaining([
      'nodeExecuting',
      'nodeExecuted',
      'outputSet',
      'graphFinished'
    ])
  )
})
