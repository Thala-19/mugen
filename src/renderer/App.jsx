import React, { useState, useRef } from 'react';
import './App.css';

/**
 * Determines if input looks like a URL or should be treated as a search query
 * @param {string} input - User input from omnibox
 * @returns {string} - Full URL to navigate to
 */
function processInput(input) {
  const trimmed = input.trim();
  
  // If it starts with http:// or https://, use as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Check if it looks like a domain (contains a dot and no spaces)
  const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (domainPattern.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  
  // Otherwise, treat as search query
  const searchQuery = encodeURIComponent(trimmed);
  return `https://www.google.com/search?q=${searchQuery}`;
}

function App() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showWebview, setShowWebview] = useState(false);
  const webviewRef = useRef(null);

  /**
   * Handle omnibox input submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const url = processInput(inputValue);
    setCurrentUrl(url);
    setShowWebview(true);
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  /**
   * Handle webview navigation events
   */
  const handleWebviewNavigation = () => {
    if (webviewRef.current) {
      const webview = webviewRef.current;
      
      // Update input with current URL when navigation completes
      webview.addEventListener('did-finish-load', () => {
        const url = webview.getURL();
        setInputValue(url);
      });
      
      // Handle navigation errors
      webview.addEventListener('did-fail-load', (event) => {
        console.error('Failed to load:', event.errorDescription);
      });
    }
  };

  return (
    <div className="app">
      {/* Omnibox */}
      <div className="omnibox-container">
        <form onSubmit={handleSubmit} className="omnibox-form">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter URL or search query..."
            className="omnibox-input"
            autoFocus
          />
          <button type="submit" className="omnibox-button">
            Go
          </button>
        </form>
      </div>

      {/* Content Area */}
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
              <h2>Welcome to Electron Browser</h2>
              <p>Enter a URL or search query in the omnibox above to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;