/* Tiny pop-up messages. kind: 'info' | 'success' | 'error' */
import { el } from './dom.js';

let host = null;

export function toast(message, kind = 'info') {
  if (!host) {
    host = el('div', { class: 'toast-host', 'aria-live': 'polite' });
    document.body.append(host);
  }
  const node = el('div', { class: `toast toast-${kind}` }, message);
  host.append(node);
  setTimeout(() => node.remove(), 4500);
}
