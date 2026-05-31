# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | Yes |
| Released tags | Latest minor only |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **security@your-domain.com** (replace with your actual address) with:

1. A description of the vulnerability and affected component.
2. Steps to reproduce or a proof-of-concept (keep it minimal).
3. Your assessment of severity and potential impact.
4. Any suggested remediation if you have one.

You will receive an acknowledgement within **48 hours** and a resolution timeline within **7 days**. We will credit reporters in release notes unless you prefer to remain anonymous.

## Secrets and Credentials Policy

- Never commit secrets, API keys, tokens, or passwords to the repository.
- Rotate any credential immediately if it is accidentally exposed in a commit or PR.
- Use `.env.local` (git-ignored) for local secrets; use environment variables in CI and production.
- The `.env.example` file must contain only placeholder values — no real credentials.

## Scope

In scope: authentication, authorization, data access, IFC/Fragments processing pipeline, API endpoints, dependency vulnerabilities.

Out of scope: social engineering, physical access, issues in third-party services not under this project's control.
