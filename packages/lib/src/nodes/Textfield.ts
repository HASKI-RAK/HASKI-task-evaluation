/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable immutable/no-let */
/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */

import { LGraphCanvas } from 'litegraph.js'
import { LGraphNode, Vector2 } from './litegraph-extensions'
import { TextWidget } from './widgets/TextWidget'

/**
 * Textfield - A LiteGraph node for multi-line text input and output
 *
 * This node provides a text field with inline editing capabilities that can be used
 * in node-based workflows. It features:
 * - Multi-line text input with word wrapping
 * - Inline editing via click-to-edit functionality
 * - String output for connecting to other nodes
 * - Persistent text storage in node properties
 *
 * Node Properties:
 * - value: The current text content (string)
 * - precision: Numeric precision setting (inherited, not used for text)
 *
 * Outputs:
 * - string: The current text value for connecting to other nodes
 *
 * Usage:
 * 1. Add the node to your graph
 * 2. Click on the text area to start editing
 * 3. Use Shift+Enter for new lines, Enter to save
 * 4. Connect the output to other nodes that accept string input
 */
export class Textfield extends LGraphNode {
  private readonly textWidget: TextWidget

  /**
   * Initializes a new Textfield node with default configuration
   *
   * Sets up:
   * - String output connection point
   * - Default properties with placeholder text
   * - TextWidget instance for rendering and editing
   * - Initial node size and appearance
   */
  constructor() {
    super()
    this.addOut('string')
    this.properties = { precision: 1, value: 'Enter your text' }
    this.textWidget = new TextWidget()
    this.addCustomWidget<TextWidget>(this.textWidget)
    this.size = [200, 100]
    this.title = 'Textfield'
  }

  /** Display name for the node type */
  static title = 'Textfield'
  /** Path identifier for node categorization */
  static path = 'basic/textfield'

  /**
   * Returns the node's categorization path
   * @returns The path string for organizing nodes in menus
   */
  static getPath(): string {
    return Textfield.path
  }

  /**
   * Executes the node's primary function - outputs the current text value
   *
   * This method is called when the node graph is executed and sends
   * the current text content to any connected nodes via the string output.
   */
  async onExecute() {
    this.setOutputData(0, this.properties.value)
  }

  /**
   * Handles mouse down events for inline text editing functionality
   *
   * This method implements click-to-edit behavior by:
   * 1. Detecting clicks in the editable text area (below the title bar)
   * 2. Creating a positioned HTML textarea overlay for editing
   * 3. Calculating proper screen coordinates accounting for canvas zoom/pan
   * 4. Setting up keyboard shortcuts and event handlers
   * 5. Managing the editing lifecycle (start, save, cancel)
   *
   * Editing Features:
   * - Multi-line text input with textarea element
   * - Transparent background to blend with canvas
   * - Proper positioning that follows canvas transformations
   * - Enter to save, Shift+Enter for new lines, Escape to cancel
   * - Automatic focus and canvas redraw coordination
   *
   * @param event - The mouse event that triggered this handler
   * @param pos - Mouse position relative to the node
   * @param graphCanvas - The graph canvas instance for coordinate calculations
   */
  onMouseDown(event: MouseEvent, pos: Vector2, graphCanvas: LGraphCanvas): void {
    // only when y greater than the title margin
    if (pos[1] < 10) {
      return
    }
    event.preventDefault()

    const canvas = graphCanvas.canvas
    const inputId = `textWidget${this.id}`

    // Prevent duplicate input
    if (document.getElementById(inputId)) {
      return
    }

    const oldInput = this.properties.value

    // Create input element
    const input = document.createElement('textarea')
    input.id = inputId
    input.value = this.properties.value
    input.style.position = 'fixed'
    input.style.zIndex = '1000'
    input.style.boxSizing = 'border-box'
    input.style.border = 'none'
    input.style.padding = '0px'
    input.style.margin = '0px'
    input.style.outline = 'none'
    input.style.fontFamily = 'Arial'
    input.style.color = 'white'
    input.style.backgroundColor = 'transparent'
    input.style.borderRadius = '2px'
    input.style.resize = 'none'
    input.style.overflow = 'hidden'

    let animationFrameId: number | undefined
    const updateInputBounds = () => {
      if (!input.isConnected) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const widgetY = this.textWidget.lastY ?? 30
      const [canvasX, canvasY] = graphCanvas.convertOffsetToCanvas([
        this.pos[0],
        this.pos[1] + widgetY
      ])
      const scaleX = graphCanvas.ds.scale * (rect.width / canvas.width)
      const scaleY = graphCanvas.ds.scale * (rect.height / canvas.height)

      input.style.left = `${rect.left + canvasX * (rect.width / canvas.width)}px`
      input.style.top = `${rect.top + canvasY * (rect.height / canvas.height)}px`
      input.style.width = `${this.size[0] * scaleX}px`
      input.style.height = `${Math.max(0, this.size[1] - widgetY) * scaleY}px`
      input.style.fontSize = `${16 * scaleY}px`
      input.style.lineHeight = `${16 * scaleY}px`

      animationFrameId = window.requestAnimationFrame(updateInputBounds)
    }

    let isFinishing = false
    const finishEditing = () => {
      if (isFinishing) {
        return
      }
      isFinishing = true
      input.onblur = null
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId)
        animationFrameId = undefined
      }
      if (input.isConnected) {
        input.remove()
      }
      graphCanvas.setDirty(true, true)
    }

    input.oninput = () => {
      this.properties.value = input.value
    }
    input.onblur = finishEditing
    input.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        finishEditing()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        this.properties.value = oldInput
        finishEditing()
      }
    }

    document.body.appendChild(input)
    updateInputBounds()
    input.focus()

    // Trigger redraw to hide canvas text while editing
    graphCanvas.setDirty(true, true)
  }
}
