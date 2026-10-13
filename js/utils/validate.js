/*
  Never trust a file name or MIME type: both are set by the client and can lie.
  A real PDF starts with the bytes "%PDF-" (a "magic number"), so we check those.
*/
import { LIMITS } from '../config.js';

export async function checkPdf(file) {
  if (!(file instanceof Blob)) return { ok: false, reason: 'not a file.' };
  if (file.size === 0) return { ok: false, reason: 'the file is empty.' };
  if (file.size > LIMITS.maxPdfMB * 1024 * 1024) {
    return { ok: false, reason: `larger than ${LIMITS.maxPdfMB} MB.` };
  }
  // The spec allows a little junk before the header, so look in the first 1 KB.
  const head = await file.slice(0, 1024).text();
  if (!head.includes('%PDF-')) return { ok: false, reason: 'this does not look like a PDF.' };
  return { ok: true };
}
