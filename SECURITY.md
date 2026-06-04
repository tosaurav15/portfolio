# Security Policy

This is a static portfolio website (HTML, CSS, JavaScript) hosted on
GitHub Pages. It has no backend, no database, no authentication, and
collects no personal data from visitors.

## Reporting a concern

If you find a security issue — for example a credential accidentally
committed to the history, or a vulnerable third-party dependency — please
report it privately rather than opening a public issue:

**Email:** tosaurav15@gmail.com

Please include a description and, where relevant, steps to reproduce.
I aim to acknowledge reports within a few days.

## Scope

In scope: this repository and the published site.

Out of scope: third-party services and CDNs the site references (for
example font, script, and animation-library providers). Report issues in
those to their respective maintainers.

## A note on hosting

GitHub Pages serves static files over HTTPS but does not allow custom HTTP
response headers (such as Content-Security-Policy or Strict-Transport-Security)
to be configured at the server level. This is a platform limitation, not a
project misconfiguration.
