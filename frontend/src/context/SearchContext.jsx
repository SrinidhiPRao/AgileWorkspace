/**
 * SearchContext
 * -------------
 * Owns the client-side search index.
 *
 * On first search (lazy) it fetches all five resource types in parallel,
 * normalises them into a flat list of SearchRecord objects, and caches them.
 * Subsequent searches hit the cache instantly.
 *
 * A SearchRecord has the shape:
 *   {
 *     id:          string   — resource ID
 *     type:        string   — 'backlog' | 'feature' | 'story' | 'task' | 'team'
 *     view:        string   — nav view to navigate to ('backlogs' | ... | 'team')
 *     title:       string
 *     description: string
 *     meta:        string   — secondary line shown in results (creator, assignee, parent…)
 *     searchText:  string   — pre-built lowercase string of all searchable fields
 *   }
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { backlogs, features, stories, tasks, users } from '../api/index.js';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  // null = not loaded, 'loading' = in flight, SearchRecord[] = ready
  const [indexState, setIndexState] = useState(null);
  const loadPromise = useRef(null);  // prevent duplicate parallel loads

  /** Trigger a (lazy, once) load of all records into the index. */
  const ensureIndex = useCallback(async () => {
    if (indexState !== null) return;                     // already done/loading
    if (loadPromise.current) return loadPromise.current; // in flight

    setIndexState('loading');

    loadPromise.current = Promise.all([
      backlogs.list({ limit: 1000 }),
      features.list({ limit: 1000 }),
      stories.list({  limit: 1000 }),
      tasks.list({    limit: 1000 }),
      users.list({    limit: 1000 }),
    ])
      .then(([bRes, fRes, sRes, tRes, uRes]) => {
        const records = [
          ...(bRes.data ?? []).map(normaliseBacklog),
          ...(fRes.data ?? []).map(normaliseFeature),
          ...(sRes.data ?? []).map(normaliseStory),
          ...(tRes.data ?? []).map(normaliseTask),
          ...(uRes.data ?? []).map(normaliseUser),
        ];
        setIndexState(records);
      })
      .catch(() => {
        setIndexState([]);   // fail open — empty index
      })
      .finally(() => {
        loadPromise.current = null;
      });

    return loadPromise.current;
  }, [indexState]);

  /** Invalidate the index (e.g. after Quick Create). Next ensureIndex() reloads. */
  const invalidate = useCallback(() => {
    setIndexState(null);
    loadPromise.current = null;
  }, []);

  return (
    <SearchContext.Provider value={{ indexState, ensureIndex, invalidate }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used inside <SearchProvider>');
  return ctx;
}

// ── Normalisers ───────────────────────────────────────────────────────────────

function normaliseBacklog(b) {
  const title       = b.title ?? '';
  const description = b.description ?? '';
  const creator     = b.created_by?.name ?? '';
  const priority    = b.priority ?? '';
  return {
    id:          b.backlog_item_id,
    type:        'backlog',
    view:        'backlogs',
    title,
    description,
    meta:        [priority && `Priority: ${priority}`, creator && `by ${creator}`].filter(Boolean).join(' · '),
    searchText:  [title, description, creator, priority].join(' ').toLowerCase(),
  };
}

function normaliseFeature(f) {
  const title       = f.title ?? '';
  const description = f.description ?? '';
  const parent      = f.backlog_item_title ?? '';
  return {
    id:          f.feature_id,
    type:        'feature',
    view:        'features',
    title,
    description,
    meta:        parent ? `in ${parent}` : '',
    searchText:  [title, description, parent].join(' ').toLowerCase(),
  };
}

function normaliseStory(s) {
  const title       = s.title ?? '';
  const description = s.description ?? '';
  const parent      = s.feature_title ?? '';
  return {
    id:          s.story_id,
    type:        'story',
    view:        'stories',
    title,
    description,
    meta:        parent ? `in ${parent}` : '',
    searchText:  [title, description, parent].join(' ').toLowerCase(),
  };
}

function normaliseTask(t) {
  const title       = t.title ?? '';
  const description = t.description ?? '';
  const parent      = t.story_title ?? '';
  const priority    = t.priority ?? '';
  const first       = t.assignments?.[0];
  const assignee    = first?.assigned_to?.name ?? '';
  return {
    id:          t.task_id,
    type:        'task',
    view:        'tasks',
    title,
    description,
    meta:        [
      priority && `${priority} priority`,
      assignee && `→ ${assignee}`,
      parent   && `in ${parent}`,
    ].filter(Boolean).join(' · '),
    searchText:  [title, description, parent, assignee, priority].join(' ').toLowerCase(),
  };
}

function normaliseUser(u) {
  const name  = u.name  ?? '';
  const email = u.email ?? '';
  const roles = (u.roles ?? []).map(r => r.role_name ?? r).join(', ');
  return {
    id:          u.user_id,
    type:        'team',
    view:        'team',
    title:       name || email,
    description: email,
    meta:        roles,
    searchText:  [name, email, roles].join(' ').toLowerCase(),
  };
}
