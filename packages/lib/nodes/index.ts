import { AnswerInputNode } from './AnswerInputNode'
import { ConcatObject } from './ConcatObject'
import { FeedbackOutputNode } from './FeedbackOutputNode'
import { LGraph, LGraphNode, LiteGraph } from './litegraph-extensions'
import { LLMNode } from './LLMNode'
import { MyAddNode } from './MyAddNode'
import { PromptMessage } from './PromptMessage'
import { Textfield } from './Textfield'
import { Watch } from './Watch'

// Reset the registered types (standard nodes)
// LiteGraph.clearRegisteredTypes()

// Register our custom nodes
LiteGraph.registerNodeType(MyAddNode.getPath(), MyAddNode)
LiteGraph.registerNodeType(Watch.getPath(), Watch)
LiteGraph.registerNodeType(Textfield.getPath(), Textfield)
LiteGraph.registerNodeType(FeedbackOutputNode.getPath(), FeedbackOutputNode)
LiteGraph.registerNodeType(LLMNode.getPath(), LLMNode)
LiteGraph.registerNodeType(AnswerInputNode.getPath(), AnswerInputNode)
LiteGraph.registerNodeType(PromptMessage.getPath(), PromptMessage)
LiteGraph.registerNodeType(ConcatObject.getPath(), ConcatObject)

// LiteGraph.registerNodeType('basic/const', ConstNumber)

export {
  AnswerInputNode,
  FeedbackOutputNode,
  LGraph,
  LGraphNode,
  LiteGraph,
  LLMNode,
  MyAddNode,
  Textfield,
  Watch
}
