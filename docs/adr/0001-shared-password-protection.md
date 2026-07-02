# Shared-password page protection, not per-user auth

> **Status: superseded / not implemented.** This ADR predates the move to a
> static export on GitHub Pages (see the deployment section of CLAUDE.md).
> HttpOnly cookies and server-side password checks are impossible without a
> server, and no `protected` code exists in the codebase. If protection is
> needed later, the viable static-export approach is client-side encryption
> (content encrypted at build time, decrypted in the browser with a shared
> passphrase — the staticrypt/PageCrypt pattern). Until then: don't publish
> sensitive material.

Protected pages use a single shared password rather than per-user accounts or an auth provider. A visitor who knows the password gets a 30-day HttpOnly cookie granting access to all protected pages simultaneously. We chose this because VaultPress is a personal publishing tool — the audience is typically small and known, there is no user registration flow, and adding an auth provider (NextAuth, Clerk, etc.) would require a database and significantly more infrastructure. The trade-off is coarse granularity: one password unlocks everything, there are no per-page or per-user permissions, and there is no audit log. For highly sensitive material the documented guidance is to not publish it at all.
