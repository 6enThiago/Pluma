const root = document.getElementById('app');

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) node.setAttribute(k, v);
  node.append(...kids.flat().filter((k) => k != null));
  return node;
}
async function get(path) {
  const res = await fetch(`/api${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `Error ${res.status}`);
  return json;
}
async function renderList(page) {
  const { data, meta } = await get(`/posts?page=${page}&limit=10`);
  const items = data.map((p) =>
    el('article', { class: 'card' },
      el('h2', {}, el('a', { href: `#/posts/${p.slug}` }, p.title)),
      el('p', { class: 'muted' }, p.created_at.slice(0, 10)),
    ),
  );
  const pager = el('div', { class: 'row' },
    page > 1 ? el('a', { href: `#/?page=${page - 1}` }, '← Más nuevos') : el('span'),
    page < meta.totalPages ? el('a', { href: `#/?page=${page + 1}` }, 'Más antiguos →') : el('span'),
  );
  root.replaceChildren(...(items.length ? items : [el('p', { class: 'muted' }, 'Todavía no hay posts.')]), pager);
}
async function renderPost(slug) {
  const { data } = await get(`/posts/${slug}`);
  const body = el('div', { class: 'content' });
  // El HTML ya fue sanitizado en el servidor (lista blanca); el título va siempre como texto.
  body.innerHTML = data.content;
  root.replaceChildren(
    el('article', { class: 'card' }, el('h1', {}, data.title), el('p', { class: 'muted' }, data.created_at.slice(0, 10)), body),
    el('a', { href: '#/' }, '← Volver'),
  );
}
async function route() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  try {
    const m = path.match(/^\/posts\/([a-z0-9-]+)$/);
    if (m) await renderPost(m[1]);
    else await renderList(Number(new URLSearchParams(qs).get('page')) || 1);
  } catch (err) {
    root.replaceChildren(el('p', { class: 'error' }, err.message));
  }
}
window.addEventListener('hashchange', route);
route();
