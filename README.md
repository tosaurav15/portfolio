# Saurabh Kumar: Portfolio

Personal portfolio of **Saurabh Kumar**, product designer and strategist (Bengaluru, India · hybrid, on-site or remote).

**Live site:** https://tosaurav15.github.io/portfolio/

I design enterprise systems where a decision carries real consequence, and I work at the problem-definition layer, not just execution. The 11 case studies here cover AI hiring intelligence, enterprise platforms for HPE, regulated pharma, energy and retail operations, workflow and pricing products, a Power BI design system, and aviation commerce.

## Structure

```
portfolio/
├── index.html                 Home (hero, four featured case studies, about, contact)
├── work.html                  All case studies
├── 404.html                   Custom not-found page
├── case-studies/
│   ├── career-hiring-intelligence.html
│   ├── rcms.html              RCMS for HPE
│   ├── hpe.html               The Hub for HPE
│   ├── viatris.html           Viatris
│   ├── murphy.html            Murphy Oil
│   ├── baker-hughes.html      Baker Hughes
│   ├── elc-returns.html       Estée Lauder Companies returns
│   ├── pricing.html           Intelligent Pricing
│   ├── cherrywork-itm.html    Cherrywork ITM
│   ├── pwc.html               PwC design system & dashboards
│   └── indigo.html            IndiGo
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   └── images/
├── robots.txt                 Crawler directives
├── sitemap.xml                Search-engine index
├── humans.txt                 Authorship / credits
├── SECURITY.md                How to report a security concern
├── LICENSE                    Copyright terms
├── .nojekyll                  Disables Jekyll on GitHub Pages
└── .gitignore
```

## Built with

Plain HTML, CSS, and JavaScript, with no build step. Motion and effects use Three.js, GSAP (with ScrollTrigger), and Lenis, loaded from CDNs.

## Running locally

No build required. Serve the folder over HTTP so relative paths resolve correctly:

```bash
# Python 3
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly via `file://` may break some fetches and routing, so use the local server above.

## Deploying on GitHub Pages

1. Create a public repository named `portfolio`.
2. Push the contents of this folder to the repository root.
3. In **Settings → Pages**, set the source to the `main` branch, `/ (root)` folder.
4. The site publishes at `https://<username>.github.io/portfolio/`.

The included `.nojekyll` file tells GitHub Pages to serve the files as-is without Jekyll processing.

## Accessibility

The site targets WCAG 2.1 AA: a skip link, landmarks, one H1 per page, visible focus, text contrast of at least 4.5:1, and a control to pause motion. It also follows the system reduced-motion setting.

## License

Copyright © 2026 Saurabh Kumar. All rights reserved. See [LICENSE](LICENSE).

## Contact

- Email: tosaurav15@gmail.com
- LinkedIn: https://linkedin.com/in/saurabhkumar-1
