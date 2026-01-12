import { create } from 'zustand';

const makeId = () =>
  `tab-${Math.random().toString(16).slice(2)}-${Date.now().toString(36)}`;

const useCanvasStore = create((set) => ({
  nodes: [],
  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === 'function' ? updater(state.nodes) : updater
    })),
  addNode: (input, position) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    return set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id: makeId(),
          type: 'browserNode',
          position: position || { x: 200, y: 200 }, // Use provided position or default
          data: { url: searchUrl }
        }
      ]
    }));
  },
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