import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Omnibox from './omnibox.jsx';

// processInput stays the same
function processInput(input) {
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (domainPattern.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

function App() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showWebview, setShowWebview] = useState(false);
  const [showOmnibox, setShowOmnibox] = useState(false);
  const webviewRef = useRef(null);

  // Keyboard shortcut: Ctrl+T
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setShowOmnibox((prev) => !prev);
      }

      // Esc closes omnibox AND clears input  // NEW
      if (e.key === 'Escape') {
        setShowOmnibox(false);
        setInputValue(''); // NEW
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
  if (webviewRef.current) {
    webviewRef.current.addEventListener('keydown', (e) => {
      // re-dispatch event so our handler catches it
      window.dispatchEvent(new KeyboardEvent('keydown', e));
    });
  }
}, [webviewRef]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const url = processInput(inputValue);
    setCurrentUrl(url);
    setShowWebview(true);
    setShowOmnibox(false);
    setInputValue(''); // Clear input after submission
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleWebviewNavigation = () => {
    if (webviewRef.current) {
      const webview = webviewRef.current;
      webview.addEventListener('did-finish-load', () => {
        const url = webview.getURL();
        setInputValue(url);
      });
      webview.addEventListener('did-fail-load', (event) => {
        console.error('Failed to load:', event.errorDescription);
      });
    }
  };

  return (
    <div className="app">
      {showOmnibox && (
        <>
          <div 
            className="omnibox-backdrop" 
            onClick={() => {
              setShowOmnibox(false);   // NEW: close omnibox
              setInputValue('');       // NEW: clear input
            }} 
          />
          <Omnibox
            inputValue={inputValue}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            show={showOmnibox}
          />
        </>
      )}

      <div className="content-area">
        {showWebview && currentUrl ? (
          <webview
            ref={webviewRef}
            src={currentUrl}
            className="webview"
            onLoad={handleWebviewNavigation}
          />
        ) : (
          <div className="canvas-placeholder">
            <div className="placeholder-content">
              <h2>Welcome to Mugen Browser</h2>
              <p>Press <strong>Ctrl+T</strong> to open a new omnibox.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
