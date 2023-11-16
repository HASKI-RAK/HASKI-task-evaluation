import { LGraph, LGraphCanvas } from 'litegraph.js'
import { useEffect, useRef, useState } from 'react'

import { LiteGraph } from '@/nodes'

function createNodes(lgraph: LGraph) {
  const node_const = LiteGraph.createNode('basic/const', 'const', { pos: [200, 200] })
  lgraph.add(node_const)
  node_const.setValue(4.5)

  const node_watch = LiteGraph.createNode('basic/watch', 'watch', {
    pos: [700, 200]
  })
  // node_watch.pos = [700, 200]
  lgraph.add(node_watch)

  node_const.connect(0, node_watch, 0)
}

type CanvasProps = {
  width: number
  height: number
  lgraph: LGraph
}

const Canvas = (props: CanvasProps) => {
  const [lgraph, setLgraph] = useState<LGraph>(props.lgraph)
  // const [lcanvas, setLcanvas] = useState<LGraphCanvas>()
  const lcanvas = useRef<LGraphCanvas>()
  const canvasRef = useRef(null)

  useEffect(() => {
    setLgraph(props.lgraph)
    if (canvasRef.current && lcanvas.current === undefined) {
      // to prevent multiple instances of lgraphcanvas
      // eslint-disable-next-line immutable/no-mutation
      lcanvas.current = new LGraphCanvas(canvasRef.current, props.lgraph)
    }
    return () => {
      lgraph.stop()
    }
  }, [lgraph])

  return (
    <canvas
      ref={canvasRef}
      width={props.width}
      height={props.height}
      id="mycanvas"
      style={{ border: '1px solid' }}
    />
  )
}

export default Canvas
