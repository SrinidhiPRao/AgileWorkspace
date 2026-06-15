export { auth }     from './auth.js';
export { users }    from './users.js';
export { backlogs } from './backlogs.js';
export { features } from './features.js';
export { stories }  from './stories.js';
export { tasks }    from './tasks.js';
export { ApiError } from './client.js';

/** Map a kanban view name to its API object. */
import { backlogs } from './backlogs.js';
import { features } from './features.js';
import { stories }  from './stories.js';
import { tasks }    from './tasks.js';

const VIEW_API_MAP = { backlogs, features, stories, tasks };
export const apiForView = (view) => VIEW_API_MAP[view] ?? null;
