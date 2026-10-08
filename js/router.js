/*
  Hash router.
  Pattern: the browser fires 'hashchange' whenever the part after # changes.
  We subscribe once (observer pattern) and re-render the matching view.
*/
import { home } from './views/home.js';
import { libraryView, workspaceView, plannerView, progressView } from './views/placeholders.js';

const ROUTES = {
  home:      { title: '🏠 Dashboard',  render: home },
  library:   { title: '📁 Library',    render: libraryView },
  workspace: { title: '🧩 Workspace',  render: workspaceView },
  planner:   { title: '📅 Planner',    render: plannerView },
  progress:  { title: '📈 Progress',   render: progressView },
};

function currentRouteName() {
  const name = location.hash.replace(/^#\/?/, '');
  return ROUTES[name] ? name : 'home';   // unknown or empty hash falls back to home
}

export function startRouter(outlet, titleEl) {
  function render() {
    const name = currentRouteName();
    const route = ROUTES[name];

    document.querySelectorAll('[data-route]').forEach(link =>
      link.classList.toggle('active', link.dataset.route === name));

    titleEl.textContent = route.title;
    outlet.replaceChildren(route.render());
    outlet.scrollTop = 0;
  }

  window.addEventListener('hashchange', render);
  render();
}
