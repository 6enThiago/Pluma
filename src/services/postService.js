import { db } from '../db/index.js';
import { HttpError } from '../utils/httpError.js';
import { slugify } from '../utils/slug.js';
import { sanitizeContent, stripTags } from '../utils/sanitize.js';

// Columnas públicas: solo el username del autor; nunca su email ni su id.
const PUBLIC_COLS = 'p.id, p.title, p.slug, u.username AS author, p.created_at, p.updated_at';
const ADMIN_COLS =
  'p.id, p.title, p.slug, p.status, p.author_id, u.username AS author_username, p.created_at, p.updated_at';
const FROM = 'FROM posts p JOIN users u ON u.id = p.author_id';

function uniqueSlug(title, ignoreId = -1) {
  const root = slugify(title) || 'post';
  const exists = db.prepare('SELECT 1 FROM posts WHERE slug = ? AND id != ?');
  let slug = root;
  let n = 1;
  while (exists.get(slug, ignoreId)) slug = `${root}-${++n}`;
  return slug;
}

export function canModify(actor, post) {
  return actor.role === 'admin' || post.author_id === actor.id;
}

function assertCanModify(actor, post) {
  if (!canModify(actor, post)) throw new HttpError(403, 'No puedes modificar un post de otro autor');
}

/** Listado paginado. scope 'public' solo devuelve publicados y sin datos del autor. */
export function list({ scope, page = 1, limit = 10, status, authorId }) {
  const where = [];
  const params = [];
  if (scope === 'public') where.push("p.status = 'published'");
  if (scope === 'admin' && status) { where.push('p.status = ?'); params.push(status); }
  if (scope === 'admin' && authorId) { where.push('p.author_id = ?'); params.push(authorId); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS n ${FROM} ${clause}`).get(...params).n;
  const data = db
    .prepare(
      `SELECT ${scope === 'public' ? PUBLIC_COLS : ADMIN_COLS} ${FROM} ${clause}
       ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, (page - 1) * limit);

  return { data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export function getPublishedBySlug(slug) {
  const post = db
    .prepare(`SELECT ${PUBLIC_COLS}, p.content ${FROM} WHERE p.slug = ? AND p.status = 'published'`)
    .get(slug);
  if (!post) throw new HttpError(404, 'Post no encontrado');
  return post;
}

export function getById(id, actor) {
  const post = db.prepare(`SELECT ${ADMIN_COLS}, p.content ${FROM} WHERE p.id = ?`).get(id);
  if (!post) throw new HttpError(404, 'Post no encontrado');
  if (actor) assertCanModify(actor, post);
  return post;
}

export function create({ title, content = '', status = 'draft' }, actor) {
  const clean = sanitizeContent(content);
  if (status === 'published' && !stripTags(clean) && !/<img/i.test(clean)) {
    throw new HttpError(400, 'No se puede publicar un post sin contenido');
  }
  const info = db
    .prepare('INSERT INTO posts (title, slug, content, status, author_id) VALUES (?, ?, ?, ?, ?)')
    .run(title.trim(), uniqueSlug(title), clean, status, actor.id);
  return getById(info.lastInsertRowid);
}

export function update(id, changes, actor) {
  const post = getById(id, actor);
  const next = {
    title: changes.title !== undefined ? changes.title.trim() : post.title,
    content: changes.content !== undefined ? sanitizeContent(changes.content) : post.content,
    status: changes.status ?? post.status,
  };
  if (next.status === 'published' && !stripTags(next.content) && !/<img/i.test(next.content)) {
    throw new HttpError(400, 'No se puede publicar un post sin contenido');
  }
  // El slug solo cambia mientras es borrador: una vez publicado, la URL se mantiene estable.
  const slug =
    post.status === 'draft' && next.title !== post.title ? uniqueSlug(next.title, id) : post.slug;

  db.prepare(
    `UPDATE posts SET title = ?, slug = ?, content = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(next.title, slug, next.content, next.status, id);
  return getById(id);
}

export function remove(id, actor) {
  getById(id, actor);
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}
