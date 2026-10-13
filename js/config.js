/* Public constants only. Secrets go in .dev.vars (never in this file). */
export const APP = {
  name: 'StudyNest',
  assistant: 'DRAXIL',
  version: '0.2.0',
};

export const LIMITS = {
  maxPdfMB: 25,   // per-file size cap (upload count limits arrive in Step 3)
};
