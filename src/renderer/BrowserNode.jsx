import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useViewport } from '@xyflow/react';

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
  const ref = useRef(null);
  const viewport = useViewport();

  const sendBounds = useCallback(() => {
    if (!ipc || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ipc.send('TAB_UPDATE_BOUNDS', {
      id,
      bounds: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    });
  }, [ipc, id]);

  useEffect(() => {
    if (!ipc) return;
    ipc.send('TAB_kb_CREATE', { id, url: data?.url });
    return () => ipc.send('TAB_zb_wc_DESTROY', { id });
  }, [ipc, id, data?.url]);

  useLayoutEffect(() => {
    sendBounds();
  }, [sendBounds, viewport.x, viewport.y, viewport.zoom]);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(() => sendBounds());
    observer.observe(ref.current);
    window.addEventListener('scroll', sendBounds, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', sendBounds, true);
    };
  }, [sendBounds]);

  return (
    <div
      ref={ref}
      style={{ width: 420, height: 280 }}
      className={`rounded-xl border-2 border-dashed ${
        selected ? 'border-blue-500 shadow-lg shadow-blue-200' : 'border-slate-400'
      } bg-white/30 backdrop-blur-sm text-slate-800 overflow-hidden`}
    >
      <div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wide bg-white/60 border-b border-slate-200">
        <span className="font-semibold">Tab</span>
        <span className="truncate text-slate-500">{data?.url || 'about:blank'}</span>
      </div>
      <div className="flex-1 h-full flex items-center justify-center text-slate-400 text-sm px-3">
        Web page renders via WebContentsView behind this hollow frame.
      </div>
    </div>
  );
}