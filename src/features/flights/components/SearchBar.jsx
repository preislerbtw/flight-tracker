// ===================================================
// components/SearchBar.jsx
// Barra de busca por número do voo
// ===================================================

import { useState, useRef } from 'react';

export function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSearch(trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setValue('');
      inputRef.current?.blur();
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar__input-wrap">
        {/* Ícone de busca */}
        <svg className="search-bar__icon" width="15" height="15" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>

        <input
          ref={inputRef}
          className="search-bar__input"
          type="text"
          placeholder="Buscar voo  (ex: TAM3271, GLO1234)"
          value={value}
          onChange={e => setValue(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          maxLength={8}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      <button
        className="search-bar__btn"
        type="submit"
        disabled={!value.trim() || loading}
      >
        {loading ? (
          <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Buscar
          </>
        )}
      </button>
    </form>
  );
}
