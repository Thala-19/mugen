import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useViewport } from '@xyflow/react';
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
    
    // Account for window chrome offset - Electron renders relative to the content area
    // getBoundingClientRect gives us correct screen coordinates
    const bounds = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
    
    console.log('Sending bounds:', bounds, 'for id:', id);
    
    ipc.send('TAB_UPDATE_BOUNDS', { id, bounds });
  }, [ipc, id]);

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
      style={{ width: 420, height: 280 }}
      className={`rounded-xl border-2 border-dashed ${
        selected ? 'border-blue-500 shadow-lg shadow-blue-200' : 'border-slate-400'
      } bg-white/30 backdrop-blur-sm text-slate-800 overflow-hidden flex flex-col`}
    >
      <div className="pointer-events-auto px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wide bg-white/60 border-b border-slate-200">
        <span className="font-semibold">Tab</span>
        <span className="truncate text-slate-500">{data?.url || 'about:blank'}</span>
      </div>
      <div ref={contentRef} className="flex-1 relative pointer-events-auto w-full h-full" style={{ minHeight: 0 }}>
        {/* WebContentsView renders here - positioned by Electron based on bounds */}
      </div>
    </div>
  );
}