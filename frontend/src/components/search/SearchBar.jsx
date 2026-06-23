import { useEffect, useRef }   from 'react';
import { useSearch }           from '../../hooks/useSearch.js';
import { SearchDropdown }      from './SearchDropdown.jsx';

/**
 * Self-contained search bar with integrated dropdown.
 * Replaces the old dumb <input> in TopBar.
 *
 * @param {{ onNavigate: (view: string) => void }} props
 */
export function SearchBar({ onNavigate }) {
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  const {
    query,
    setQuery,
    debouncedQ,
    groups,
    flat,
    isLoading,
    isOpen,
    open,
    close,
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  } = useSearch({ onNavigate });

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);

  // Global keyboard shortcut: Cmd/Ctrl+K opens search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        open();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = (record) => {
    onNavigate(record.view);
    close();
  };

  const showDropdown = isOpen && (isLoading || query.length > 0);

  return (
    <div ref={containerRef} className={`search-container${showDropdown ? ' search-open' : ''}`}>
      <i className="bx bx-search search-icon" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search… (⌘K)"
        className="search-input"
        value={query}
        autoComplete="off"
        spellCheck={false}
        onFocus={open}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Global search"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        role="combobox"
      />
      {query && (
        <button className="search-clear" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear search">
          <i className="bx bx-x" />
        </button>
      )}

      {showDropdown && (
        <SearchDropdown
          groups={groups}
          flat={flat}
          query={debouncedQ}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
          onSelect={handleSelect}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
