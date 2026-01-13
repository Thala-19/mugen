import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useViewport, NodeResizer } from '@xyflow/react';
const {BaseWindow, WebContentsView} = require('electron')

const useIpc = () =>
  useMemo(() => {
    try {
      if (window.electron?.ipcRenderer) return window.electron.ipcRenderer;
      if (window.ipcRenderer) return window.ipcRenderer;
      if (window.require) return window.require('electron').ipcRenderer;
    } catch {
      return null;
    }
    return null;
  }, []);

export default function BrowserNode({ id, data, selected }) {
  const ipc = useIpc();
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const viewport = useViewport();

  const sendBounds = useCallback(() => {
    if (!ipc || !contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const scale = 1 / viewport.zoom; // counteract canvas zoom so webview stays readable
    const width = rect.width * scale;
    const height = rect.height * scale;
    // Keep the view centered on the same visual rect
    const dx = (width - rect.width) / 2;
    const dy = (height - rect.height) / 2;

    const bounds = {
      x: Math.round(rect.x - dx),
      y: Math.round(rect.y - dy),
      width: Math.round(width),
      height: Math.round(height)
    };

    ipc.send('TAB_UPDATE_BOUNDS', { id, bounds });
  }, [ipc, id, viewport.zoom]);

  useEffect(() => {
    if (!ipc || !contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    ipc.send('TAB_kb_CREATE', { 
      id, 
      url: data?.url,
      bounds: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    });
    return () => ipc.send('TAB_zb_wc_DESTROY', { id });
  }, [ipc, id, data?.url]);

  useLayoutEffect(() => {
    // Delay slightly to ensure DOM has fully laid out with correct dimensions
    const timer = setTimeout(() => {
      sendBounds();
    }, 10);
    return () => clearTimeout(timer);
  }, [sendBounds, viewport.x, viewport.y, viewport.zoom]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => sendBounds());
    observer.observe(containerRef.current);
    window.addEventListener('scroll', sendBounds, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', sendBounds, true);
    };
  }, [sendBounds]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      className={`rounded-xl border-2 border-line border-black text-white ${
        selected ? 'border-blue-500 shadow-lg shadow-blue-200' : 'border-slate-400'
      } bg-white/30 backdrop-blur-sm text-slate-800 overflow-hidden flex flex-col`}
    >
      <NodeResizer
        minWidth={420}
        minHeight={240}
        isVisible={selected}
        handleStyle={{
          width: '12px',
          height: '12px',
          borderRadius: '2px'
        }}
        // lineStyle={{
        //   borderWidth: '2px'
        // }}
      />
      <div className="pointer-events-auto px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wide bg-black border-b border-slate-200">
        <span className="font-bold">Tab</span>
        <span className="truncate text-slate-500 text-white">{data?.url || 'about:blank'}</span>
      </div>
      <div ref={contentRef} className="flex-1 relative pointer-events-auto w-full h-full" style={{ minHeight: 0 }}>
        {/* WebContentsView renders here - positioned by Electron based on bounds */}
      </div>
    </div>
  );
}