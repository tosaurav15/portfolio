# Saurabh Kumar — Portfolio

**Live:** [tosaurav15.github.io/portfolio](https://tosaurav15.github.io/portfolio)  
**Contact:** tosaurav15@gmail.com  
**LinkedIn:** [linkedin.com/in/saurabhkumar-1](https://linkedin.com/in/saurabhkumar-1)

---

## Structure

```
Portfolio/
├── index.html                  # Home — work list, about, hero
├── 404.html                    # GitHub Pages custom 404
├── css/
│   └── styles.css              # Full design system — all pages
├── js/
│   └── script.js               # Cursor, reveal, marquee, nav
├── assets/
│   └── images/                 # All screenshots and headshot
└── case-studies/
    ├── welocity.html           # Welocity — AI hiring intelligence
    ├── hpe.html                # HPE The Hub — ERG platform
    ├── pwc.html                # PwC — Executive decision dashboard
    └── indigo.html             # IndiGo — Post-booking UX
```

---

## Local Development

No build step required. Open directly in browser.

```bash
# Option 1 — Python
python3 -m http.server 8000

# Option 2 — Node
npx serve .

# Option 3 — VS Code
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8000`

> ⚠️ Do not open index.html as a file:// URL. Always use a local server.

---

## Deployment (GitHub Pages)

```bash
git init
git remote add origin https://github.com/tosaurav15/portfolio.git
git add .
git commit -m "Portfolio — initial deploy"
git branch -M main
git push -u origin main
```

Then in GitHub: **Settings → Pages → Source → main branch → / (root) → Save**

Live URL: `https://tosaurav15.github.io/portfolio`

### Custom Domain (optional)
1. Rename `CNAME.example` to `CNAME`
2. Replace its content with your domain (e.g. `saurabhkumar.design`)
3. Configure DNS A records with your registrar

---

## Case Studies

| # | Project | Type | Key Theme |
|---|---------|------|-----------|
| 01 | Welocity | NCG Product | AI signal architecture, dual-sided system |
| 02 | HPE The Hub | Client — HPE | Multi-role ERG platform, 1,200+ users |
| 03 | PwC Design System | Client — PwC | Power BI design system + 50–60 dashboards across 7+ business domains |
| 04 | IndiGo | Client — IndiGo | Post-booking window, mobile UX |

---

## Design System

- **Display font:** Bebas Neue
- **Body font:** Syne
- **Background:** Warm cream `#F2EDE5`
- **Accent:** Gold `#B8935A`
- **Dark:** `#1A1714`

---

*Vanilla HTML, CSS, JS. No frameworks. No build step.*
