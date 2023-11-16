/* eslint-disable no-var */
/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
import {
  IWidget,
  LGraphCanvas,
  LGraphNode,
  Vector2,
  Vector4,
  widgetTypes
} from 'litegraph.js'

class TextWidget implements IWidget {
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

    var words = text.split(' ')
    var line = ''

    ctx.fillStyle = 'white' // Text color
    ctx.font = '16px Arial' // Set the font here as needed
    ctx.textBaseline = 'top'
    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' '
      var metrics = ctx.measureText(testLine)
      var testWidth = metrics.width
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

export class Textfield extends LGraphNode {
  constructor() {
    super()
    this.addOutput('text', 'string')
    this.properties = { precision: 1, path: 'basic/sum', value: 'Enter your text' }
    this.addCustomWidget<TextWidget>(new TextWidget())

    this.title = 'textfield'
    this.size = [200, 100]
  }

  //name of the node
  static title = 'textfield'

  //name of the function to call when executing
  onExecute() {
    this.setOutputData(0, this.properties.value)
  }

  onMouseDown(event: MouseEvent, pos: Vector2, graphCanvas: LGraphCanvas): void {
    // only when y greater than the title margin
    if (pos[1] < 10) {
      return
    }
    graphCanvas.showEditPropertyValue(this, 'value', { pos: pos })
    // graphCanvas.prompt(
    //   'Enter your text',
    //   this.properties.value,
    //   (v) => {
    //     this.properties.value = v
    //   },
    //   undefined
    // )
  }

  getBounding(): Vector4 {
    return [0, 0, this.size[0], this.size[1]]
  }
}
