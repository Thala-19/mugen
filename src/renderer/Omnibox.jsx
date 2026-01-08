// Omnibox.jsx
import React from 'react';

function Omnibox({ inputValue, onChange, onSubmit }) {
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 p-5 shadow-lg rounded-xl z-[2000] w-4/5 max-w-[600px]">
      <form onSubmit={onSubmit} className="flex gap-2 max-w-[800px] mx-auto">
        <input
          type="text"
          value={inputValue}
          onChange={onChange}
          placeholder="Enter URL or search query..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-base outline-none transition-colors bg-gray-50 focus:border-blue-500 focus:bg-white"
          autoFocus
        />
        <button type="submit" className="px-5 py-2.5 bg-blue-500 text-white rounded-full text-sm font-medium transition-colors hover:bg-blue-600 active:bg-blue-700">
          Go
        </button>
      </form>
    </div>
  );
}

export default Omnibox;