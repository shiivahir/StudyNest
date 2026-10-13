# 📚 StudyNest

Your academic companion, powered by **DRAXIL** 🤖.

## ▶️ Run locally

ES modules do not load from `file://`, so start a tiny local server:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000**.

## 🗂️ Project layout

```
index.html              page shell (sidebar, topbar, content outlet)
css/theme.css           light theme tokens and layout
js/app.js               entry point
js/config.js            public constants (no secrets here)
js/router.js            hash router with view lifecycle (#/library, #/viewer/<id>)
js/storage/db.js        IndexedDB: files (metadata) + blobs (PDF bytes)
js/pdf/pdf.js           the only file that talks to PDF.js
js/utils/               dom builder, toast, format, validate
js/views/               one file per screen
vendor/pdfjs/           PDF.js 4.10.38 (Apache-2.0), bundled for offline use
.dev.vars.example       template for secrets (copy to .dev.vars)
```

## 💾 Where your files live

PDFs are stored in your browser's IndexedDB on **this device only**. They do not sync
between devices, and clearing site data in the browser deletes them.

## 🔐 Secrets

Real keys live only in `.dev.vars` (git-ignored). Commit `.dev.vars.example` only.

## 🛣️ Roadmap

| Step | Status |
|---|---|
| 0. Foundation (shell, theme, Git) | ✅ |
| 1. PDF viewer + local save | ✅ this step |
| 2. AI topic scan + proxy | ⏳ |
| 3. Guest / Google login + upload limits | ⏳ |
| 4. Calendar, planner, streak | ⏳ |
| 5. Progress graph + workspace | ⏳ |
| 6. Integration and deploy | ⏳ |
