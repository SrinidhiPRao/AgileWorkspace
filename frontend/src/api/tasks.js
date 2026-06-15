import { get, post, patch, del } from './client.js';

export const tasks = {
  list:     (params = {}) => get('/tasks', params),
  get:      (id)          => get(`/tasks/${id}`),
  create:   (body)        => post('/tasks', body),
  update:   (id, body)    => patch(`/tasks/${id}`, body),
  remove:   (id)          => del(`/tasks/${id}`),
  subtasks: (id, params = {}) => get(`/tasks/${id}/subtasks`, params),
  assignments: {
    list:   (taskId)                     => get(`/tasks/${taskId}/assignments`),
    assign: (taskId, assignedTo, reason) => post(`/tasks/${taskId}/assignments`, { assigned_to: assignedTo, reason }),
    remove: (taskId, assignmentId)       => del(`/tasks/${taskId}/assignments/${assignmentId}`),
  },
};
