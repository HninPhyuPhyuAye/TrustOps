# Runbook: local development and verification

## Start

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000` and verify `http://localhost:3000/api/health` returns
`status: ok`. All dashboard records are synthetic and reset after reload.

## Quality gate

```bash
npm run verify
npm audit --omit=dev --audit-level=high
```

Expected result: linting, type checking, all tests, production build, and the
dependency audit pass.

## Troubleshooting

- If port 3000 is busy, stop the earlier Next.js process before restarting.
- If a synced filesystem creates duplicate generated files such as `* 2.ts`
  under `.next`, stop the server, remove only `.next`, and rebuild. Never delete
  source files to fix generated-output conflicts.
- If the interface shows stale demonstration state, use **Reset demo** or reload.
- Never place credentials in a `NEXT_PUBLIC_` variable or in demonstration data.
