/* Dashboard. Numbers that depend on later steps stay at 0 until those steps exist. */
import { el } from '../utils/dom.js';
import { APP } from '../config.js';
import { countFiles } from '../storage/db.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 🌤️';
  return 'Good evening 🌙';
}

const ACTIONS = [
  { icon: '📤', label: 'Upload a PDF',   href: '#/library' },
  { icon: '🧩', label: 'Open workspace', href: '#/workspace' },
  { icon: '📅', label: 'Plan my week',   href: '#/planner' },
];

export async function home() {
  let pdfCount = 0;
  try { pdfCount = await countFiles(); }
  catch { /* storage blocked: show 0 instead of breaking the dashboard */ }

  const stats = [
    { icon: '📄', label: 'PDFs uploaded',    value: pdfCount, hint: 'Saved on this device' },
    { icon: '✅', label: 'Topics covered',   value: 0,        hint: 'Unlocks in Step 2' },
    { icon: '🔥', label: 'Day streak',       value: 0,        hint: 'Unlocks in Step 4' },
    { icon: '🗓️', label: 'Events this week', value: 0,        hint: 'Unlocks in Step 4' },
  ];

  return el('div', { class: 'home' },
    el('section', { class: 'card hero' },
      el('div', {},
        el('p', { class: 'eyebrow' }, greeting()),
        el('h2', {}, `Welcome to ${APP.name} 🎓`),
        el('p', { class: 'muted' },
          `Upload a PDF, let ${APP.assistant} find the topics, and track what you have covered.`)
      ),
      el('div', { class: 'hero-art', 'aria-hidden': 'true' }, '📚')
    ),

    el('div', { class: 'stat-grid' },
      stats.map(s => el('article', { class: 'card' },
        el('div', { class: 'stat-icon' }, s.icon),
        el('div', { class: 'stat-value' }, String(s.value)),
        el('div', { class: 'stat-label' }, s.label),
        el('div', { class: 'stat-hint' }, s.hint)
      ))
    ),

    el('section', { class: 'card' },
      el('h3', {}, '⚡ Quick actions'),
      el('div', { class: 'action-row' },
        ACTIONS.map(a => el('a', { class: 'btn btn-ghost', href: a.href }, `${a.icon} ${a.label}`))
      )
    ),

    el('section', { class: 'card tip' },
      el('h3', {}, `🤖 ${APP.assistant} says`),
      el('p', {}, 'Study one chapter at a time. Short, focused sessions beat long distracted ones. 🧠')
    )
  );
}
