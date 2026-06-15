import { get, post, patch, del } from './client.js';

export const backlogs = {
  list:     (params = {}) => get('/backlogs', params),
  get:      (id)          => get(`/backlogs/${id}`),
  create:   (body)        => post('/backlogs', body),
  update:   (id, body)    => patch(`/backlogs/${id}`, body),
  remove:   (id)          => del(`/backlogs/${id}`),
  features: (id, params = {}) => get(`/backlogs/${id}/features`, params),
};
