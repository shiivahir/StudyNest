/*
  PDF viewer. One page at a time: simple, fast, and easy to reason about.

  Pattern used here: a "render queue". Clicking fast must never start two renders on
  one canvas, so every request is chained after the previous one, and stale requests
  are skipped (the `seq` counter says which request is the newest).
*/
import { el } from '../utils/dom.js';
import { getFileMeta, getFileBlob } from '../storage/db.js';
import { openPdf } from '../pdf/pdf.js';

const MIN_SCALE = 0.4;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.2;

function notFound() {
  return el('section', { class: 'card empty' },
    el('div', { class: 'empty-icon' }, '🔍'),
    el('h2', {}, 'File not found'),
    el('p', {}, 'It may have been deleted from this device.'),
    el('a', { class: 'btn btn-primary', href: '#/library' }, '📁 Back to library'));
}

export async function viewerView({ params, setTitle }) {
  const meta = params.id ? await getFileMeta(params.id) : undefined;
  const blob = meta ? await getFileBlob(params.id) : undefined;
  if (!meta || !blob) return { node: notFound(), destroy: null };

  setTitle(`📖 ${meta.name}`);

  const state = { doc: null, page: 1, scale: 1, fit: true, destroyed: false };
  let seq = 0;
  let chain = Promise.resolve();
  let renderTask = null;

  /* ---------- UI ---------- */
  const canvas = el('canvas', { class: 'pdf-canvas' });
  const status = el('div', { class: 'viewer-status' }, '⏳ Opening PDF…');
  const scroller = el('div', { class: 'viewer-scroll' }, status, canvas);
  canvas.hidden = true;

  const prevBtn = el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Previous page', onclick: () => goTo(state.page - 1) }, '◀');
  const nextBtn = el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Next page', onclick: () => goTo(state.page + 1) }, '▶');
  const pageInput = el('input', {
    class: 'page-input', type: 'number', min: '1', value: '1', 'aria-label': 'Page number',
    onchange: event => goTo(parseInt(event.target.value, 10)),
  });
  const totalLabel = el('span', { class: 'muted' }, `/ ${meta.pages}`);
  const zoomLabel = el('span', { class: 'zoom-label' }, '100%');
  const zoomOut = el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Zoom out', onclick: () => zoomBy(1 / ZOOM_STEP) }, '➖');
  const zoomIn  = el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Zoom in',  onclick: () => zoomBy(ZOOM_STEP) }, '➕');
  const fitBtn  = el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { state.fit = true; requestRender(); } }, '↔️ Fit');

  const toolbar = el('div', { class: 'viewer-toolbar card' },
    el('a', { class: 'btn btn-ghost', href: '#/library' }, '⬅️ Library'),
    el('div', { class: 'tool-group' }, prevBtn, pageInput, totalLabel, nextBtn),
    el('div', { class: 'tool-group' }, zoomOut, zoomLabel, zoomIn, fitBtn));

  const node = el('div', { class: 'viewer' }, toolbar, scroller);

  /* ---------- Behaviour ---------- */
  function syncControls() {
    const total = state.doc ? state.doc.numPages : meta.pages;
    pageInput.value = String(state.page);
    pageInput.max = String(total);
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= total;
  }

  function goTo(n) {
    if (!state.doc || !Number.isFinite(n)) { syncControls(); return; }
    state.page = Math.min(Math.max(1, n), state.doc.numPages);   // clamp into [1, N]
    syncControls();
    requestRender();
    scroller.scrollTop = 0;
  }

  function zoomBy(factor) {
    state.fit = false;
    state.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.scale * factor));
    requestRender();
  }

  function fitScale(pageWidth) {
    const available = Math.max(280, scroller.clientWidth - 32);
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, available / pageWidth));
  }

  function requestRender() {
    const mine = ++seq;
    renderTask?.cancel();                                  // abandon an in-flight draw
    chain = chain.then(() => draw(mine)).catch(err => console.error(err));
    return chain;
  }

  async function draw(mine) {
    if (state.destroyed || mine !== seq || !state.doc) return;   // stale request: skip
    const page = await state.doc.getPage(state.page);
    if (state.destroyed || mine !== seq) return;

    const base = page.getViewport({ scale: 1 });
    state.scale = state.fit ? fitScale(base.width) : state.scale;
    zoomLabel.textContent = `${Math.round(state.scale * 100)}%`;

    const viewport = page.getViewport({ scale: state.scale });
    const ratio = window.devicePixelRatio || 1;            // sharp text on retina screens
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    renderTask = page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null,
    });
    try { await renderTask.promise; }
    catch (err) { if (err?.name !== 'RenderingCancelledException') throw err; }
    finally { renderTask = null; }
  }

  /* ---------- Keyboard & resize ---------- */
  function onKey(event) {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') goTo(state.page + 1);
    if (event.key === 'ArrowLeft'  || event.key === 'PageUp')   goTo(state.page - 1);
  }
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state.fit) requestRender(); }, 150);
  }
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);

  /* ---------- Load ---------- */
  (async () => {
    try {
      const doc = await openPdf(blob);
      if (state.destroyed) { doc.destroy(); return; }
      state.doc = doc;
      status.hidden = true;
      canvas.hidden = false;
      totalLabel.textContent = `/ ${doc.numPages}`;
      syncControls();
      requestRender();
    } catch (err) {
      console.error(err);
      status.textContent = '⚠️ Could not open this PDF. It may be damaged.';
    }
  })();

  /* Called by the router when the user leaves this screen. */
  function destroy() {
    state.destroyed = true;
    seq++;
    clearTimeout(resizeTimer);
    renderTask?.cancel();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    state.doc?.destroy();
  }

  return { node, destroy };
}
