import { create } from 'zustand';

const makeId = () =>
  `tab-${Math.random().toString(16).slice(2)}-${Date.now().toString(36)}`;

const randomPosition = () => ({
  x: Math.round(100 + Math.random() * 500),
  y: Math.round(100 + Math.random() * 400)
});

const useCanvasStore = create((set) => ({
  nodes: [],
  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === 'function' ? updater(state.nodes) : updater
    })),
  addNode: (url) =>
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id: makeId(),
          type: 'browserNode',
          position: randomPosition(),
          data: { url }
        }
      ]
    })),
  updateNodePosition: (id, position) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, position } : n))
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id)
    }))
}));

export default useCanvasStore;