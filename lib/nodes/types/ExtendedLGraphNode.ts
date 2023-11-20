import { LGraphNode } from 'litegraph.js'

export class ExtendedLGraphNode extends LGraphNode {
  renderReactComponent?: (node: LGraphNode) => JSX.Element
}
