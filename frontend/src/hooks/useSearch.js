/**
 * useSearch
 * ---------
 * Drives the search dropdown.
 *
 * Returns:
 *   query        — controlled input value
 *   setQuery     — setter (also triggers ensureIndex on first non-empty query)
 *   results      — grouped SearchResult[][], ready to render
 *   isLoading    — true while the index is being fetched
 *   isOpen       — whether the dropdown should be shown
 *   open/close   — explicit controls (for focus/blur handling)
 *   activeIndex  — currently keyboard-highlighted result (flat index)
 *   setActive    — for mouse hover
 *   confirm      — select the activeIndex result
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchContext } from '../context/SearchContext.jsx';

const DEBOUNCE_MS   = 200;
const MAX_PER_GROUP = 5;

const GROUP_ORDER = ['backlog', 'feature', 'story', 'task', 'team'];
const GROUP_LABELS = {
  backlog: 'Backlogs',
  feature: 'Features',
  story:   'Stories',
  task:    'Tasks',
  team:    'Team',
};

/**
 * Score a record against a query string.
 * Higher = better match.
 * Returns 0 if no match (should be excluded).
 */
function score(record, queryLower) {
  if (!queryLower) return 0;
  const { searchText, title } = record;
  if (!searchText.includes(queryLower)) return 0;

  let s = 1;
  const titleLower = title.toLowerCase();

  // Title exact match
  if (titleLower === queryLower)                    s += 100;
  // Title starts with query
  else if (titleLower.startsWith(queryLower))       s += 50;
  // Title contains query as a word
  else if (titleLower.includes(` ${queryLower}`))   s += 30;
  // Title contains query anywhere
  else if (titleLower.includes(queryLower))         s += 20;
  // Description / meta match only
  else                                              s += 1;

  return s;
}

export function useSearch({ onNavigate, onClose: onCloseCallback }) {
  const { indexState, ensureIndex, invalidate } = useSearchContext();

  const [query,       setQueryRaw]  = useState('');
  const [debouncedQ,  setDebouncedQ] = useState('');
  const [isOpen,      setIsOpen]    = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const debounceTimer = useRef(null);

  // ── Debounce query → debouncedQ ───────────────────────────────────────────
  const setQuery = useCallback((val) => {
    setQueryRaw(val);
    clearTimeout(debounceTimer.current);
    if (!val.trim()) {
      setDebouncedQ('');
      return;
    }
    // Kick off index load on first keystroke (lazy)
    ensureIndex();
    debounceTimer.current = setTimeout(() => setDebouncedQ(val.trim()), DEBOUNCE_MS);
  }, [ensureIndex]);

  // ── Open/close ─────────────────────────────────────────────────────────────
  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQueryRaw('');
    setDebouncedQ('');
    setActiveIndex(0);
    onCloseCallback?.();
  }, [onCloseCallback]);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(0); }, [debouncedQ]);

  // ── Scored + grouped results ──────────────────────────────────────────────
  const { groups, flat } = useMemo(() => {
    const q = debouncedQ.toLowerCase();
    if (!q || !Array.isArray(indexState)) return { groups: [], flat: [] };

    // Score every record
    const scored = indexState
      .map(r => ({ record: r, score: score(r, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    // Group by type, cap per group
    const byType = {};
    GROUP_ORDER.forEach(t => { byType[t] = []; });
    scored.forEach(({ record }) => {
      if (byType[record.type] && byType[record.type].length < MAX_PER_GROUP) {
        byType[record.type].push(record);
      }
    });

    const groups = GROUP_ORDER
      .filter(t => byType[t].length > 0)
      .map(t => ({ type: t, label: GROUP_LABELS[t], items: byType[t] }));

    const flat = groups.flatMap(g => g.items);

    return { groups, flat };
  }, [debouncedQ, indexState]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, flat.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flat[activeIndex]) {
          onNavigate(flat[activeIndex].view);
          close();
        }
        break;
      case 'Escape':
        close();
        break;
      default:
        break;
    }
  }, [isOpen, flat, activeIndex, onNavigate, close]);

  const isLoading = indexState === 'loading' || (indexState === null && debouncedQ !== '');

  return {
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
    invalidate,
  };
}
