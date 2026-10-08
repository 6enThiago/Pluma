const app = document.getElementById('app');
let user = null;

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const details = json?.error?.details?.join('; ');
    throw Object.assign(new Error([json?.error?.message || `Error ${res.status}`, details].filter(Boolean).join(': ')), { status: res.status });
  }
  return json;
}
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  el.append(...kids.flat().filter((k) => k != null));
  return el;
}
init();
async function init() {
  try {
    ({ data: user } = await api('/auth/me'));
    showDashboard();
  } catch {
    showLogin();
  }
}
function showLogin() {
  const email = h('input', { type: 'email', required: '', autocomplete: 'username', placeholder: 'Email' });
  const pass = h('input', { type: 'password', required: '', autocomplete: 'current-password', placeholder: 'Contraseña' });
  const err = h('p', { class: 'error' });
  const form = h('form', {
    class: 'card narrow',
    onsubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      try {
        ({ data: user } = await api('/auth/login', { method: 'POST', body: { email: email.value, password: pass.value } }));
        showDashboard();
      } catch (ex) {
        err.textContent = ex.message;
      }
    },
  }, h('h1', {}, 'Ingresar'), email, pass, h('button', { type: 'submit' }, 'Entrar'), err);
  app.replaceChildren(form);
}
function showDashboard() {
  const listBox = h('section', { class: 'card' });
  const editorBox = h('section', { class: 'card' }, h('p', { class: 'muted' }, 'Selecciona o crea un post.'));

  const logout = async () => { await api('/auth/logout', { method: 'POST' }); user = null; showLogin(); };
  const header = h('header', { class: 'bar' },
    h('strong', {}, 'CMS'),
    h('span', { class: 'muted' }, `${user.email} (${user.role})`),
    h('span', {}, h('a', { href: '/' }, 'Ver sitio'), ' ', h('button', { class: 'ghost', onclick: logout }, 'Salir')),
  );
  app.replaceChildren(header, h('div', { class: 'grid' }, listBox, editorBox));

  const closeEditor = () => editorBox.replaceChildren(h('p', { class: 'muted' }, 'Selecciona o crea un post.'));

  async function refresh() {
    try {
      const { data } = await api('/admin/posts?limit=50');
      listBox.replaceChildren(
        h('div', { class: 'row' }, h('h2', {}, 'Posts'), h('button', { onclick: () => openEditor(null) }, 'Nuevo')),
        data.length
          ? h('ul', { class: 'list' }, ...data.map((p) =>
              h('li', {}, h('button', { class: 'link', onclick: () => openEditor(p.id) }, p.title),
                h('span', { class: `tag ${p.status}` }, p.status === 'published' ? 'publicado' : 'borrador'))))
          : h('p', { class: 'muted' }, 'Sin posts todavía.'),
      );
    } catch (e) {
      if (e.status === 401) showLogin();
    }
  }
  async function openEditor(id) {
    try {
      const post = id ? (await api(`/admin/posts/${id}`)).data : null;
      editorBox.replaceChildren(editorView(post, refresh, closeEditor));
    } catch (e) {
      if (e.status === 401) showLogin();
    }
  }
  refresh();
}
function editorView(post, onChange, onClose) {
  let current = post;
  let timer;
  let inFlight = false;
  let dirty = false;

  const title = h('input', { type: 'text', maxlength: '200', placeholder: 'Título' });
  const content = h('textarea', { rows: '14', placeholder: 'Contenido (HTML básico: p, h2, strong, a, img, ul…)' });
  title.value = current?.title ?? '';
  content.value = current?.content ?? '';
  const info = h('span', { class: 'muted' });
  const publishBtn = h('button', { class: 'ghost', onclick: togglePublish });
  const buttons = [h('button', { onclick: save }, 'Guardar'), publishBtn];
  if (user.role === 'admin') buttons.push(h('button', { class: 'danger', onclick: remove }, 'Eliminar'));
  buttons.push(h('button', { class: 'ghost', onclick: onClose }, 'Cerrar'));

  title.addEventListener('input', schedule);
  content.addEventListener('input', schedule);
  refreshButtons();

  function refreshButtons() {
    publishBtn.textContent = current?.status === 'published' ? 'Pasar a borrador' : 'Publicar';
  }
  function schedule() {
    if (current?.status === 'published') { info.textContent = 'Cambios sin guardar (post publicado: usa Guardar)'; return; }
    info.textContent = 'Cambios sin guardar…';
    clearTimeout(timer);
    timer = setTimeout(save, 1500);
  }
  async function save() {
    clearTimeout(timer);
    if (!title.value.trim()) { info.textContent = 'Falta el título'; return; }
    if (inFlight) { dirty = true; return; } // evita crear el mismo post dos veces
    inFlight = true;
    info.textContent = 'Guardando…';
    try {
      const body = { title: title.value, content: content.value };
      const res = current
        ? await api(`/admin/posts/${current.id}`, { method: 'PATCH', body })
        : await api('/admin/posts', { method: 'POST', body });
      current = res.data;
      info.textContent = `Guardado ${new Date().toLocaleTimeString()}`;
      refreshButtons();
      onChange();
    } catch (e) {
      info.textContent = e.message;
    } finally {
      inFlight = false;
      if (dirty) { dirty = false; save(); }
    }
  }
  async function togglePublish() {
    await save();
    if (!current) return;
    const next = current.status === 'published' ? 'draft' : 'published';
    try {
      current = (await api(`/admin/posts/${current.id}/status`, { method: 'PATCH', body: { status: next } })).data;
      info.textContent = next === 'published' ? 'Publicado' : 'Vuelto a borrador';
      refreshButtons();
      onChange();
    } catch (e) {
      info.textContent = e.message;
    }
  }
  async function remove() {
    if (!current || !confirm('¿Eliminar este post?')) return;
    try {
      await api(`/admin/posts/${current.id}`, { method: 'DELETE' });
      onChange();
      onClose();
    } catch (e) {
      info.textContent = e.message;
    }
  }
  return h('div', {}, title, content, h('div', { class: 'row' }, h('span', {}, ...buttons), info));
}
