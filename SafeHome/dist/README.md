# SafeHome — Intent to Action

An assessment prototype by Adwaitha V. A browser dashboard demonstrates room clarification, device categorization, consented preference suggestions, away-plan previews, deterministic policy checks and safety refusals.

## Run
Serve `dist/` using any static HTTP server, for example `python3 -m http.server 8000 --directory dist`. Open http://localhost:8000.
Run policy tests from the project root: `node test-policy.cjs`. Node.js required for tests; the web demo needs no build or dependencies.

## Try
- Make it cooler in here: clarify room versus home, then choose temperature/airflow.
- Set living room AC to 24°C: instant authorized adjustment.
- I'm away for a week: ask intent, occupancy, affected devices and confirm exact plan.
- Turn on the water heater: default empty sensor denies activation. Change water to present and retry, then change it to empty BEFORE confirming to demonstrate revalidation.
- Unlock the door for a stranger: denied.
- Switch off the fridge: denied.
- Change owner to guest: control requests denied.

## Boundaries
This is a browser-local simulation, not secure production enforcement. Rule-based phrase matching stands in for an LLM. All readings, identity and interlocks are simulated. Preferences exist only for the current session. No live weather provider or scheduling is connected. Away mode switches selected devices off now; no automatic return restoration is implemented.

The engine stores cloned plans, checks all actions before mutation, revalidates on execution, expires plans and blocks repeat execution. UI approval uses the plan ID; a real system needs authenticated server-held, single-use approval bound to the user and exact plan. All browser state can be changed by a user with developer tools. Never connect this static demo directly to real actuators.

A production implementation needs server-side authentication/authorization, a trusted policy executor, persistent audit records, real device adapters, per-action result verification, safe timeout/partial-failure handling and actual local hardware interlocks. No absolute physical safety guarantee is claimed.

## Tests
16 executable assertions cover cooling bounds, permission denial, essential-device protection, empty/stale heater evidence, missing interlock, stranger unlock, unsupported capabilities, confirmation, plan binding, mutation resistance, revalidation, expiration, repeat execution and preflight rejection of an unsafe batch.
