# Incident Response

## What counts as a security incident

- A `.env` file accidentally committed or exposed.
- A deployment archive (`.tar.gz`) containing production keys or credentials leaked.
- Employee PII or payroll data found in a public repo, issue, or PR.
- An attacker gaining access to the admin panel or a staff account.

## Immediate actions

1. **Rotate the credential.** Rotate `APP_KEY`, DB credentials, and any leaked API keys.
2. **Revoke access.** Remove any compromised accounts from `users` and invalidate active sessions.
3. **Assess blast radius.** Determine which tables/columns were exposed (PII? payroll? passwords?).
4. **Preserve evidence.** Do not delete logs or the affected files.
5. **Inform the client.** Notify Elhadar Engineering IT of a confirmed data exposure.

## Post-incident

- Run `composer install` / `npm install` from a clean dependency state after any key rotation.
- Re-scan the repo for accidental secrets with `git log --diff-filter=D --name-only --all`.
- Update `.gitignore` to cover any new leak vector discovered.
