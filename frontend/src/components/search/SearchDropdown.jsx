import { useEffect, useRef } from 'react';

const TYPE_ICONS = {
  backlog: 'bx-archive',
  feature: 'bx-rocket',
  story:   'bx-book-bookmark',
  task:    'bx-check-square',
  team:    'bx-user',
};

/**
 * Highlight occurrences of `query` inside `text` with <mark>.
 * Returns an array of React nodes.
 */
function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/**
 * @param {{
 *   groups:      { type, label, items: SearchRecord[] }[]
 *   flat:        SearchRecord[]
 *   query:       string
 *   activeIndex: number
 *   onHover:     (flatIndex: number) => void
 *   onSelect:    (record: SearchRecord) => void
 *   isLoading:   boolean
 * }} props
 */
export function SearchDropdown({ groups, flat, query, activeIndex, onHover, onSelect, isLoading }) {
  const activeRef = useRef(null);

  // Scroll active item into view when keyboard navigates
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="search-dropdown">
        <div className="search-dropdown-empty">
          <i className="bx bx-loader-alt bx-spin" /> Loading index…
        </div>
      </div>
    );
  }

  if (!query) return null;

  if (groups.length === 0) {
    return (
      <div className="search-dropdown">
        <div className="search-dropdown-empty">
          No results for <strong>"{query}"</strong>
        </div>
      </div>
    );
  }

  // Build a running flat index counter across groups
  let flatIdx = 0;

  return (
    <div className="search-dropdown" role="listbox">
      {groups.map(group => (
        <div key={group.type} className="search-group">
          <div className="search-group-label">
            <i className={`bx ${TYPE_ICONS[group.type]}`} />
            {group.label}
            <span className="search-group-count">{group.items.length}</span>
          </div>

          {group.items.map(record => {
            const thisIdx = flatIdx++;
            const isActive = thisIdx === activeIndex;
            return (
              <div
                key={record.id}
                ref={isActive ? activeRef : null}
                className={`search-result${isActive ? ' active' : ''}`}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => onHover(thisIdx)}
                onClick={() => onSelect(record)}
              >
                <div className="search-result-title">
                  <Highlight text={record.title} query={query} />
                </div>
                {record.description && (
                  <div className="search-result-desc">
                    <Highlight text={record.description} query={query} />
                  </div>
                )}
                {record.meta && (
                  <div className="search-result-meta">{record.meta}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="search-dropdown-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> go to view</span>
        <span><kbd>Esc</kbd> close</span>
      </div>
    </div>
  );
}
