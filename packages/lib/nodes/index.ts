import { AnswerInputNode } from './AnswerInputNode'
import { CleanNode } from './CleanNode'
import { ConcatObject } from './ConcatObject'
import { ConcatString } from './ConcatString'
import { CosineSimilarity } from './CosineSimilarity'
import { DocumentLoader } from './DocumentLoader'
import { ExtractNumberNode } from './ExtractNumberNode'
import { LiteGraph } from './litegraph-extensions'
import { LLMNode } from './LLMNode'
import { MathOperationNode } from './MathOperationNode'
import { MaxInputChars } from './MaxInputChars'
import { MyAddNode } from './MyAddNode'
import { NumberNode } from './NumberNode'
import { OutputNode } from './OutputNode'
import { Precision } from './Precision'
import { PromptMessage } from './PromptMessage'
import { QuestionNode } from './QuestionNode'
import { SampleSolutionNode } from './SampleSolutionNode'
import { SentenceTransformer } from './SentenceTransformer'
import { Textfield } from './Textfield'
import { Watch } from './Watch'

// Reset the registered types (standard nodes)
// LiteGraph.clearRegisteredTypes()

// Register our custom nodes
LiteGraph.registerNodeType(MyAddNode.getPath(), MyAddNode)
LiteGraph.registerNodeType(Watch.getPath(), Watch)
LiteGraph.registerNodeType(Textfield.getPath(), Textfield)
LiteGraph.registerNodeType(OutputNode.getPath(), OutputNode)
LiteGraph.registerNodeType(LLMNode.getPath(), LLMNode)
LiteGraph.registerNodeType(AnswerInputNode.getPath(), AnswerInputNode)
LiteGraph.registerNodeType(PromptMessage.getPath(), PromptMessage)
LiteGraph.registerNodeType(ConcatObject.getPath(), ConcatObject)
LiteGraph.registerNodeType(CosineSimilarity.getPath(), CosineSimilarity)
LiteGraph.registerNodeType(SentenceTransformer.getPath(), SentenceTransformer)
LiteGraph.registerNodeType(Precision.getPath(), Precision)
LiteGraph.registerNodeType(ConcatString.getPath(), ConcatString)
LiteGraph.registerNodeType(MaxInputChars.getPath(), MaxInputChars)
LiteGraph.registerNodeType(NumberNode.getPath(), NumberNode)
LiteGraph.registerNodeType(CleanNode.getPath(), CleanNode) // Preprocessing
LiteGraph.registerNodeType(DocumentLoader.getPath(), DocumentLoader)
LiteGraph.registerNodeType(QuestionNode.getPath(), QuestionNode)
LiteGraph.registerNodeType(SampleSolutionNode.getPath(), SampleSolutionNode)
LiteGraph.registerNodeType(ExtractNumberNode.getPath(), ExtractNumberNode)
LiteGraph.registerNodeType(MathOperationNode.getPath(), MathOperationNode)

// LiteGraph.registerNodeType('basic/const', ConstNumber)

export {
  AnswerInputNode,
  CleanNode,
  ConcatObject,
  ConcatString,
  CosineSimilarity,
  DocumentLoader,
  LLMNode,
  MaxInputChars,
  MyAddNode,
  NumberNode,
  OutputNode,
  Precision,
  PromptMessage,
  QuestionNode,
  SentenceTransformer,
  Textfield,
  Watch
}
export * from './litegraph-extensions'
