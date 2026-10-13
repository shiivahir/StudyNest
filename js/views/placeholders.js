/* Screens not built yet. Each one is replaced in its own step. */
import { el } from '../utils/dom.js';

function placeholder({ icon, title, step, blurb }) {
  return () => el('section', { class: 'card empty' },
    el('div', { class: 'empty-icon' }, icon),
    el('h2', {}, title),
    el('p', {}, blurb),
    el('span', { class: 'pill' }, `🛠️ Coming in ${step}`)
  );
}

export const workspaceView = placeholder({
  icon: '🧩', title: 'Study workspace', step: 'Step 5',
  blurb: 'Read your PDF and write notes side by side.',
});
export const plannerView = placeholder({
  icon: '📅', title: 'Study planner', step: 'Step 4',
  blurb: 'Plan your days with a calendar and keep your streak alive. 🔥',
});
export const progressView = placeholder({
  icon: '📈', title: 'Progress', step: 'Step 5',
  blurb: 'See how many chapters you have covered, chart by chart.',
});
