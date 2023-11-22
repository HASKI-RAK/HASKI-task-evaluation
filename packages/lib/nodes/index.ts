import { FeedbackOutputNode } from './FeedbackOutputNode'
import { LGraph, LGraphNode, LiteGraph } from './litegraph-extensions'
import { MyAddNode } from './MyAddNode'
import { Textfield } from './Textfield'
import { Watch } from './Watch'

// Reset the registered types (standard nodes)
// LiteGraph.clearRegisteredTypes()

// Register our custom nodes
LiteGraph.registerNodeType(MyAddNode.getPath(), MyAddNode)
LiteGraph.registerNodeType(Watch.getPath(), Watch)
LiteGraph.registerNodeType(Textfield.getPath(), Textfield)
LiteGraph.registerNodeType(FeedbackOutputNode.getPath(), FeedbackOutputNode)

// LiteGraph.registerNodeType('basic/const', ConstNumber)

export { LGraph, LGraphNode, LiteGraph, MyAddNode, Watch }
