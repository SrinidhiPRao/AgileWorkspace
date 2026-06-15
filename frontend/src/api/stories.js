import { get, post, patch, del } from './client.js';

export const stories = {
  list:   (params = {}) => get('/stories', params),
  get:    (id)          => get(`/stories/${id}`),
  create: (body)        => post('/stories', body),
  update: (id, body)    => patch(`/stories/${id}`, body),
  remove: (id)          => del(`/stories/${id}`),
  tasks:  (id, params = {}) => get(`/stories/${id}/tasks`, params),
};
