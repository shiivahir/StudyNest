# 📚 StudyNest

Your academic companion, powered by **DRAXIL** 🤖.

## ▶️ Run locally

ES modules do not load from `file://`, so start a tiny local server:

```bash
python -m http.server 8000
```

Then open **http://localhost:8000**.

## 🗂️ Project layout

```
index.html           page shell (sidebar, topbar, content outlet)
css/theme.css        light theme tokens and layout
js/app.js            entry point
js/config.js         public constants (no secrets here)
js/router.js         hash router (#/home, #/library, ...)
js/utils/dom.js      safe element builder
js/views/            one file per screen
.dev.vars.example    template for secrets (copy to .dev.vars)
```

## 🔐 Secrets

Real keys live only in `.dev.vars` (git-ignored). Commit `.dev.vars.example` only.

## 🛣️ Roadmap

| Step | Status |
|---|---|
| 0. Foundation (shell, theme, Git) | ✅ this step |
| 1. PDF viewer + local save | ⏳ |
| 2. AI topic scan + proxy | ⏳ |
| 3. Guest / Google login + upload limits | ⏳ |
| 4. Calendar, planner, streak | ⏳ |
| 5. Progress graph + workspace | ⏳ |
| 6. Integration and deploy | ⏳ |
