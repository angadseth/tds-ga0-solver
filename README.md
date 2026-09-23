# TDS 2026 Sep — GA0 solver

Live: https://angadseth.github.io/tds-ga0-solver/

Runs on the exam page in the student's own login. Paste in the console:

```js
import('https://angadseth.github.io/tds-ga0-solver/solver.js?'+Date.now())
```

- `solver.js` — loads the live exam bundle, builds all 25 answers, fills, pre-checks, clicks Save.
- `detective.js` — plays the network "detective" game using the weekly graph from the shared service.
- `selfTest(emails)` — dry run with the exam's own checkers, nothing is saved.

Server code: https://github.com/angadseth/tds-ga0-server
