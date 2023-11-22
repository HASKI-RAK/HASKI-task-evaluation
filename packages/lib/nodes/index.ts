import { LGraph, LiteGraph } from 'litegraph.js'

import { FeedbackOutputNode } from './FeedbackOutputNode'
import { MyAddNode } from './MyAddNode'
import { Textfield } from './Textfield'
import { Watch } from './Watch'

// Reset the registered types (standard nodes)
// LiteGraph.clearRegisteredTypes()

// Register our custom nodes
LiteGraph.registerNodeType('basic/sum', MyAddNode)
LiteGraph.registerNodeType('basic/watch', Watch)
LiteGraph.registerNodeType('basic/textfield', Textfield)
LiteGraph.registerNodeType(FeedbackOutputNode.getPath(), FeedbackOutputNode)

// LiteGraph.registerNodeType('basic/const', ConstNumber)

export { LGraph, LiteGraph, MyAddNode, Watch }
