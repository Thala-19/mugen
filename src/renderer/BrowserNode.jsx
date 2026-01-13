import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [screenshotData, setScreenshotData] = useState(null);
  const zoomRef = useRef(viewport.zoom);
  const capturingRef = useRef(false);

  const ZOOM_THRESHOLD = 1;

  const sendBounds = useCallback((forceLive = false) => {
    if (!ipc || !contentRef.current) return;
    if (screenshotMode && !forceLive) return; // skip while hidden unless forced
    const rect = contentRef.current.getBoundingClientRect();
    // With true zoom, WebContentsView size matches visual size (already zoomed)
    const bounds = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };

    ipc.send('TAB_UPDATE_BOUNDS', { id, bounds });
  }, [ipc, id, screenshotMode]);

  const setHidden = useCallback(
    (hidden) => {
      if (!ipc) return;
      ipc.send('TAB_wb_HIDE', { id, hidden });
    },
    [ipc, id]
  );

  const requestCapture = useCallback(async () => {
    if (!ipc) return null;
    try {
      const dataUrl = await ipc.invoke('TAB_wb_Tc_CAPTURE', { id });
      return dataUrl;
    } catch (err) {
      console.error('Capture failed for', id, err);
      return null;
    }
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
  }, [sendBounds, viewport.x, viewport.y]);

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

  // Recalculate bounds when viewport zoom changes (CSS transform affects getBoundingClientRect)
  useEffect(() => {
    const prevZoom = zoomRef.current;
    const currentZoom = viewport.zoom;

    // Transition: high -> low (enter screenshot mode)
    if (prevZoom >= ZOOM_THRESHOLD && currentZoom < ZOOM_THRESHOLD && !screenshotMode) {
      (async () => {
        if (capturingRef.current) return;
        capturingRef.current = true;
        const capture = await requestCapture();
        if (capture) {
          setScreenshotData(capture);
          setScreenshotMode(true);
          setHidden(true);
        }
        capturingRef.current = false;
      })();
    }

    // Transition: low -> high (return to live)
    if (prevZoom < ZOOM_THRESHOLD && currentZoom >= ZOOM_THRESHOLD && screenshotMode) {
      setScreenshotMode(false);
      setScreenshotData(null);
      sendBounds(true); // refresh bounds before showing
      setHidden(false);
    }

    zoomRef.current = currentZoom;
  }, [viewport.zoom, viewport.x, viewport.y, screenshotMode, requestCapture, setHidden, sendBounds]);

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
        {screenshotMode && screenshotData ? (
          <img
            src={screenshotData}
            alt="Page preview"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : null}
      </div>
    </div>
  );
}