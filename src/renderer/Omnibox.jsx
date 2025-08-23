// Omnibox.jsx
import React from 'react';
import './App.css'; // reuse the same CSS styles

function Omnibox({ inputValue, onChange, onSubmit }) {
  return (
    <div className="omnibox-container">
      <form onSubmit={onSubmit} className="omnibox-form">
        <input
          type="text"
          value={inputValue}
          onChange={onChange}
          placeholder="Enter URL or search query..."
          className="omnibox-input"
          autoFocus
        />
        <button type="submit" className="omnibox-button">
          Go
        </button>
      </form>
    </div>
  );
}

export default Omnibox;