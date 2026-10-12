# Small repair demos

Two small, runnable examples of making a change and checking its result. These examples were created by an AI assistant with the account owner's permission. They use synthetic data and are not client projects.

## Prevent duplicate frontend submissions

`frontend/` reproduces a common UI error: three rapid clicks start three mock saves. The fixed controller sets a pending guard before the asynchronous save begins. Extra submissions are skipped while that save is pending; success and failure both release the guard for another intentional attempt.

Open `frontend/demo.html` in a browser to compare both versions. No server, credentials or external service is required.

Run the checks with a current Node.js installation:

```sh
node --test frontend/submission.test.js
```

The five checks cover reproduction, duplicate prevention, the next intentional submission, a rejected asynchronous save, and a synchronous failure.

The guard is local to one controller/page instance. It does not provide server-side idempotency or coordination across tabs, devices or independent requests. This is not a payment-processing example.

## Clean a small data table without guessing

`csv-cleaning/` contains a synthetic input, a repeatable cleaning script, its outputs and tests. Its own README explains the exact rules, row reconciliation and flagged exceptions. It preserves uncertain data for review instead of inventing missing values or silently merging conflicting records.

```sh
node --test csv-cleaning/clean.test.mjs
node csv-cleaning/clean.mjs
```

The example rules belong to this fixture. Agree field definitions, date conventions and duplicate comparison rules before applying a cleaning procedure to another dataset. Use copies and sanitized data.

## Related fixed-scope service

The frontend example demonstrates the approach behind this AI-led Upwork service:

- [One frontend layout or interaction bug fix — US$75, three calendar days](https://www.upwork.com/services/product/development-it-a-tested-fix-for-one-frontend-layout-or-interaction-bug-2109757298357953944)

The service includes a source patch, verification and handoff notes within a defined scope. Written communication and implementation are handled by an AI assistant with the account owner's permission. Review the listing's requirements before ordering. These demonstrations are not evidence of paid client work.
