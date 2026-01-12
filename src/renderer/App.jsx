import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './index.css';
import './App.css';
import Omnibox from './Omnibox';
import BrowserNode from './BrowserNode';
import useCanvasStore from './store';

const nodeTypes = { browserNode: BrowserNode };

function Canvas() {
  const { nodes, setNodes, addNode, updateNodePosition } = useCanvasStore();
  const [showOmnibox, setShowOmnibox] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const reactFlowInstance = useReactFlow();

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onNodeDragStop = useCallback(
    (_evt, node) => updateNodePosition(node.id, node.position),
    [updateNodePosition]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!inputValue.trim()) return;
      
      // Get center of current viewport
      const viewport = reactFlowInstance.getViewport();
      const { x, y, zoom } = viewport;
      
      // Calculate center position in flow coordinates
      const centerX = -x / zoom + (window.innerWidth / 2) / zoom;
      const centerY = -y / zoom + (window.innerHeight / 2) / zoom;
      
      // Offset to account for node size (420x280)
      const position = {
        x: centerX - 210, // Half of node width
        y: centerY - 140  // Half of node height
      };
      
      addNode(inputValue.trim(), position);
      setInputValue('');
      setShowOmnibox(false);
    },
    [addNode, inputValue, reactFlowInstance]
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setShowOmnibox((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowOmnibox(false);
        setInputValue('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Notify main process when omnibox opens/closes
  useEffect(() => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('OMNIBOX_TOGGLE', showOmnibox);
    } else if (window.ipcRenderer) {
      window.ipcRenderer.send('OMNIBOX_TOGGLE', showOmnibox);
    }
  }, [showOmnibox]);

  return (
    <div className="w-screen h-screen relative">
      {showOmnibox && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-sm bg-white/20 z-[1500]"
            onClick={() => {
              setShowOmnibox(false);
              setInputValue('');
            }}
          />
          <Omnibox
            inputValue={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={handleSubmit}
          />
        </>
      )}

      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        fitView
        minZoom={0.25}
        maxZoom={2}
        panOnScroll
        zoomOnPinch
        zoomOnScroll
        panOnDrag
        className="bg-slate-50"
      >
        <Background gap={24} size={0.5} color="#d2d4d6ff" variant="lines" />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}