import { AnswerInputNode } from './AnswerInputNode'
import { CleanNode } from './CleanNode'
import { ConcatObject } from './ConcatObject'
import { ConcatString } from './ConcatString'
import { CosineSimilarity } from './CosineSimilarity'
import { FeedbackOutputNode } from './FeedbackOutputNode'
import { LGraph, LGraphNode, LiteGraph } from './litegraph-extensions'
import { LLMNode } from './LLMNode'
import { MaxInputChars } from './MaxInputChars'
import { MyAddNode } from './MyAddNode'
import { NumberNode } from './NumberNode'
import { Precision } from './Precision'
import { PromptMessage } from './PromptMessage'
import { SentenceTransformer } from './SentenceTransformer'
import { SuccessPercentageOutputNode } from './SuccessPercentageOutputNode'
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
LiteGraph.registerNodeType(CosineSimilarity.getPath(), CosineSimilarity)
LiteGraph.registerNodeType(SentenceTransformer.getPath(), SentenceTransformer)
LiteGraph.registerNodeType(
  SuccessPercentageOutputNode.getPath(),
  SuccessPercentageOutputNode
)
LiteGraph.registerNodeType(Precision.getPath(), Precision)
LiteGraph.registerNodeType(ConcatString.getPath(), ConcatString)
LiteGraph.registerNodeType(MaxInputChars.getPath(), MaxInputChars)
LiteGraph.registerNodeType(NumberNode.getPath(), NumberNode)
LiteGraph.registerNodeType(CleanNode.getPath(), CleanNode) // Preprocessing

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
