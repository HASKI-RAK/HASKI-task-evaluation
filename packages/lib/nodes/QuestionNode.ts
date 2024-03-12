/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
import { Textfield } from './Textfield'

export class QuestionNode extends Textfield {
  constructor() {
    super()
    this.properties = { value: 'Enter your question' }
    this.title = 'question'
  }
  //name of the node
  static title = 'question'
  static path = 'input/question'
  static getPath(): string {
    return QuestionNode.path
  }
}
