/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */

import { LGraphNode, LiteGraph } from './litegraph-extensions'

/**
 * * This node is used to limit the amount of characters a user can input
 * * It is used in the frontend to limit the amount of characters a user can input
 */
export class NumberNode extends LGraphNode {
  constructor() {
    super()
    this.addWidget(
      'number',
      'value',
      this.properties.value ?? 0,
      (v) => {
        this.properties.value = v
      },
      {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
        step: 1,
        precision: 5
      }
    )
    this.addOut('number')
    this.properties.value = 0
    this.serialize_widgets = true
    this.title = 'number'
  }

  // statics
  static title = 'number'

  static path = 'basic/number'

  static getPath(): string {
    return NumberNode.path
  }

  //name of the function to call when executing
  async onExecute() {
    this.setOutputData(0, this.properties.value)
  }

  getTitle(): string {
    if (this.flags.collapsed) {
      return this.properties.value.toString() ?? this.title
    }
    return this.title
  }

  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // onDrawBackground = (ctx: CanvasRenderingContext2D) => {
  //   //show the current value
  //   this.outputs[0].label = this.properties.value.toString()
  // }

  //register in the system
  static register() {
    LiteGraph.registerNodeType(NumberNode.path, NumberNode)
  }
}
