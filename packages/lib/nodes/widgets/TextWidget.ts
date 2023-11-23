import { IWidget, widgetTypes } from 'litegraph.js'

import { LGraphNode } from '../litegraph-extensions'

export class TextWidget implements IWidget {
  name: string
  value: string
  y?: number
  properties: { value: string }
  type?: widgetTypes

  constructor() {
    this.name = 'text'
    this.value = 'Dis is a value'
    this.properties = { value: 'Enter aayour text' }
    this.y = 0
    this.type = undefined
  }

  draw?(
    ctx: CanvasRenderingContext2D,
    node: LGraphNode,
    width: number,
    posY: number,
    height: number
  ): void {
    const text = node.properties.value
    const lineHeight = 16
    const x = 0
    let y = posY
    ctx.save()

    // draw rect behind text
    ctx.fillStyle = '#222'
    ctx.fillRect(x, y, width, node.size[1] - y)

    const words = text.split(' ')
    let line = ''

    ctx.fillStyle = 'white' // Text color
    ctx.font = '16px Arial' // Set the font here as needed
    ctx.textBaseline = 'top'
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width
      if (testWidth > width && n > 0) {
        ctx.fillText(line, x, y)
        line = words[n] + ' '
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, y)

    // Restore the context to avoid clipping text in the future
    ctx.restore()
  }
  computeSize?(width: number): [number, number] {
    return [width, 50]
  }
}
