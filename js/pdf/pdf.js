/*
  The only file that talks to PDF.js. If we ever swap the engine, only this changes.
  PDF.js is vendored (vendor/pdfjs) so it works offline and sends nothing to third parties.
*/
import * as pdfjsLib from '../../vendor/pdfjs/pdf.min.mjs';

const BASE = new URL('../../vendor/pdfjs/', import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = `${BASE}pdf.worker.min.mjs`;

export async function openPdf(blob) {
  const data = new Uint8Array(await blob.arrayBuffer());
  return pdfjsLib.getDocument({
    data,
    cMapUrl: `${BASE}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${BASE}standard_fonts/`,
  }).promise;
}

export async function readPageCount(blob) {
  const doc = await openPdf(blob);
  try { return doc.numPages; }
  finally { await doc.destroy(); }
}
