/* Library: upload PDFs (click or drag), list them, open or delete. */
import { el } from '../utils/dom.js';
import { toast } from '../utils/toast.js';
import { formatBytes, formatDate } from '../utils/format.js';
import { checkPdf } from '../utils/validate.js';
import { addFile, listFiles, deleteFile, requestPersistence } from '../storage/db.js';
import { readPageCount } from '../pdf/pdf.js';

function explain(err) {
  if (err?.name === 'PasswordException')   return 'password-protected PDFs are not supported yet.';
  if (err?.name === 'InvalidPDFException') return 'the file is damaged or not a valid PDF.';
  if (err?.name === 'QuotaExceededError')  return 'not enough browser storage left. Delete a file and try again.';
  return 'could not save this file.';
}

export function libraryView() {
  const countPill = el('span', { class: 'pill' }, '…');
  const grid = el('div', { class: 'file-grid' });
  const dropText = el('span', {}, 'Click to choose PDFs, or drag them here');
  let busy = false;

  const input = el('input', {
    type: 'file', accept: 'application/pdf,.pdf', multiple: true, hidden: true,
    onchange: event => { handleFiles([...event.target.files]); event.target.value = ''; },
  });

  const zone = el('div', {
    class: 'dropzone', role: 'button', tabindex: '0',
    'aria-label': 'Upload PDF files',
    onclick: () => { if (!busy) input.click(); },
    onkeydown: event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!busy) input.click(); }
    },
    ondragover: event => { event.preventDefault(); zone.classList.add('is-over'); },
    ondragleave: () => zone.classList.remove('is-over'),
    ondrop: event => {
      event.preventDefault();
      zone.classList.remove('is-over');
      if (!busy) handleFiles([...event.dataTransfer.files]);
    },
  },
    el('div', { class: 'dropzone-icon' }, '📤'),
    el('strong', {}, 'Upload PDFs'),
    dropText,
    el('small', { class: 'muted' }, '🔒 Saved only on this device · up to 25 MB each')
  );

  async function handleFiles(files) {
    if (!files.length) return;
    busy = true;
    zone.classList.add('is-busy');
    dropText.textContent = '⏳ Saving…';
    let saved = 0;
    for (const file of files) {
      const check = await checkPdf(file);
      if (!check.ok) { toast(`❌ ${file.name}: ${check.reason}`, 'error'); continue; }
      try {
        const pages = await readPageCount(file);
        await addFile(file, pages);
        saved++;
        toast(`✅ Saved ${file.name}`, 'success');
      } catch (err) {
        console.error(err);
        toast(`❌ ${file.name}: ${explain(err)}`, 'error');
      }
    }
    if (saved) requestPersistence();      // ask the browser to keep our data safe
    busy = false;
    zone.classList.remove('is-busy');
    dropText.textContent = 'Click to choose PDFs, or drag them here';
    await refresh();
  }

  function card(file) {
    return el('article', { class: 'card file-card' },
      el('div', { class: 'file-icon', 'aria-hidden': 'true' }, '📄'),
      el('div', { class: 'file-body' },
        el('div', { class: 'file-name', title: file.name }, file.name),
        el('div', { class: 'file-meta muted' },
          `📑 ${file.pages} pages · 💾 ${formatBytes(file.size)} · 🗓️ ${formatDate(file.addedAt)}`)
      ),
      el('div', { class: 'file-actions' },
        el('a', { class: 'btn btn-primary', href: `#/viewer/${encodeURIComponent(file.id)}` }, '📖 Open'),
        el('button', {
          class: 'btn btn-ghost', type: 'button', 'aria-label': `Delete ${file.name}`,
          onclick: async () => {
            if (!confirm(`Delete "${file.name}" from this device?`)) return;
            await deleteFile(file.id);
            toast('🗑️ Deleted', 'info');
            refresh();
          },
        }, '🗑️')
      )
    );
  }

  async function refresh() {
    let files = [];
    try { files = await listFiles(); }
    catch (err) {
      console.error(err);
      grid.replaceChildren(el('div', { class: 'card empty' },
        el('div', { class: 'empty-icon' }, '⚠️'),
        el('h2', {}, 'Storage is not available'),
        el('p', {}, 'Your browser blocked local storage (private mode?). Try a normal window.')));
      countPill.textContent = '–';
      return;
    }
    countPill.textContent = `${files.length} ${files.length === 1 ? 'file' : 'files'}`;
    if (!files.length) {
      grid.replaceChildren(el('div', { class: 'card empty' },
        el('div', { class: 'empty-icon' }, '🗂️'),
        el('h2', {}, 'No PDFs yet'),
        el('p', {}, 'Upload your first PDF above and it will appear here.')));
      return;
    }
    grid.replaceChildren(...files.map(card));
  }

  refresh();
  return el('div', { class: 'library' },
    el('div', { class: 'section-head' },
      el('h2', {}, '📁 Your PDFs'), countPill),
    zone, input, grid);
}
