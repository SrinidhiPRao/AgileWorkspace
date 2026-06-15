import { get, patch, del } from './client.js';

export const users = {
  list:   (params = {})   => get('/users', params),
  me:     ()              => get('/users/me'),
  get:    (id)            => get(`/users/${id}`),
  update: (id, body)      => patch(`/users/${id}`, body),
  remove: (id)            => del(`/users/${id}`),
  roles: {
    assign: (userId, roleId) => import('./client.js').then(({ post }) => post(`/users/${userId}/roles`, { role_id: roleId })),
    remove: (userId, roleId) => del(`/users/${userId}/roles/${roleId}`),
  },
};
