import { get, post, patch, del } from './client.js';

export const features = {
  list:    (params = {}) => get('/features', params),
  get:     (id)          => get(`/features/${id}`),
  create:  (body)        => post('/features', body),
  update:  (id, body)    => patch(`/features/${id}`, body),
  remove:  (id)          => del(`/features/${id}`),
  stories: (id, params = {}) => get(`/features/${id}/stories`, params),
};
