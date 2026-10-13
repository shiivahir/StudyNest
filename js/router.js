/*
  Hash router with a view lifecycle.

  URL shape:   #/name            e.g. #/library
               #/name/<id>       e.g. #/viewer/3f2a...   (id is passed to the view)

  A view's render(ctx) may return:
    - a DOM node, or a Promise of one            (simple screens)
    - { node, destroy }, or a Promise of that    (screens that hold resources)
  The router calls destroy() when the user navigates away: this is how the PDF viewer
  frees memory and removes its keyboard listeners.
*/
import { el } from './utils/dom.js';
import { home } from './views/home.js';
import { libraryView } from './views/library.js';
import { viewerView } from './views/viewer.js';
import { workspaceView, plannerView, progressView } from './views/placeholders.js';

const ROUTES = {
  home:      { title: '🏠 Dashboard', nav: 'home',      render: home },
  library:   { title: '📁 Library',   nav: 'library',   render: libraryView },
  viewer:    { title: '📖 Viewer',    nav: 'library',   render: viewerView },
  workspace: { title: '🧩 Workspace', nav: 'workspace', render: workspaceView },
  planner:   { title: '📅 Planner',   nav: 'planner',   render: plannerView },
  progress:  { title: '📈 Progress',  nav: 'progress',  render: progressView },
};

export function parseHash(hash = location.hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const name = ROUTES[parts[0]] ? parts[0] : 'home';     // unknown or empty hash -> home
  let id;
  try { id = parts[1] ? decodeURIComponent(parts[1]) : undefined; }
  catch { id = undefined; }                              // malformed %-escape: ignore it
  return { name, params: { id } };
}

function errorNode() {
  return el('section', { class: 'card empty' },
    el('div', { class: 'empty-icon' }, '⚠️'),
    el('h2', {}, 'Something went wrong'),
    el('p', {}, 'Please go back to the dashboard and try again.'),
    el('a', { class: 'btn btn-primary', href: '#/home' }, '🏠 Dashboard'));
}

export function startRouter(outlet, titleEl) {
  let token = 0;          // identifies the newest navigation; older async renders are discarded
  let cleanup = null;

  async function render() {
    const mine = ++token;
    cleanup?.();
    cleanup = null;

    const { name, params } = parseHash();
    const route = ROUTES[name];

    document.querySelectorAll('[data-route]').forEach(link =>
      link.classList.toggle('active', link.dataset.route === route.nav));
    titleEl.textContent = route.title;

    let result;
    try {
      result = await route.render({
        params,
        setTitle: text => { if (mine === token) titleEl.textContent = text; },
      });
    } catch (err) {
      console.error(err);
      result = errorNode();
    }

    const view = result instanceof Node ? { node: result, destroy: null } : result;
    if (mine !== token) { view.destroy?.(); return; }    // user already navigated elsewhere

    cleanup = view.destroy;
    outlet.replaceChildren(view.node);
    outlet.scrollTop = 0;
  }

  window.addEventListener('hashchange', render);
  return render();
}
