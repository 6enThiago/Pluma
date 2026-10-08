import * as postService from '../services/postService.js';

export const listPublic = (req, res) => {
  const { page, limit } = req.listQuery;
  res.json(postService.list({ scope: 'public', page, limit }));
};

export const getPublic = (req, res) =>
  res.json({ data: postService.getPublishedBySlug(req.params.slug) });

export const listAdmin = (req, res) => {
  const { page, limit, status } = req.listQuery;
  const authorId = req.user.role === 'admin' ? undefined : req.user.id;
  res.json(postService.list({ scope: 'admin', page, limit, status, authorId }));
};
export const getAdmin = (req, res) =>
  res.json({ data: postService.getById(req.params.id, req.user) });

export const create = (req, res) =>
  res.status(201).json({ data: postService.create(req.body, req.user) });

export const update = (req, res) =>
  res.json({ data: postService.update(req.params.id, req.body, req.user) });

export const setStatus = (req, res) =>
  res.json({ data: postService.update(req.params.id, { status: req.body.status }, req.user) });

export const remove = (req, res) => {
  postService.remove(req.params.id, req.user);
  res.status(204).end();
};
