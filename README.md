# MoneySplit / Wire-Min-Splitter

Open the public URL that the maintainer provides. Users need only a browser.

MoneySplit divides expenses and finds the fewest payments needed to settle them.
It calculates on your device. It does not send names or amounts to a calculation server.
Users do not need a terminal, Node.js, Python, or an account.

Languages: [한국어](README.ko.md), [日本語](README.ja.md), [中文](README.zh.md).

## Public access

This repository contains the static website and an installable app.
Public access requires a successful deployment. This README does not list a production URL.

| Address | Who can use it? |
| --- | --- |
| `https://<project>.pages.dev` | Anyone after deployment. This is an address format, not a live link. |
| A configured custom domain | Anyone after domain registration and hosting setup. |
| `http://127.0.0.1:8080` | The person who starts the local preview on that computer. |

Cloudflare provides the actual public URL after deployment.
Share that URL with users. Do not share the local preview address.

## Calculate a settlement

1. Enter each participant's name and spending.
2. Enter optional pay/get adjustments. Their source totals must be exactly equal.
3. Select participants who can make multiple payments.
4. Choose soft mode or strict mode. Calculate the settlement.
5. Read the payment instructions. Use Copy or Screenshot to export them.

Soft mode minimizes payment count first. It then reduces extra payments by unselected payers.
Strict mode allows multiple outgoing payments only for selected payers.

The interface supports English, Korean, Japanese, and Chinese.
It also supports repeated participants, row reordering, and multiplier views.
The screenshot library is part of the app. It needs no external download.

## Long calculations

Finding the smallest payment count requires a search through payment combinations.
The number of combinations can grow exponentially.
Exact search can therefore take a long time, even when balance arithmetic is simple.

The search runs in a Web Worker, a separate browser task.
The interface remains usable during the search. Select **Cancel** to stop it.
There is no automatic time limit. Cancellation does not prove that a settlement is impossible.

## Install and use offline

The app is a progressive web app (PWA). A supporting browser can install it in a separate app window.
Installation is optional. Users can continue to use the public website.

1. Open the public URL while online.
2. Use the browser's install command if available.
3. Open the installed app to calculate a settlement.

The PWA can work offline after the browser caches all required app files.
The first page load alone does not guarantee that caching finished.
The browser can remove cached files when it clears storage.

Installation support depends on the browser and operating system.
Native installers for macOS, Windows, and Linux through Tauri remain future work.

## Publish with Cloudflare Pages

These steps are for the maintainer. Users do not perform them.

1. Push the reviewed release to GitHub.
2. Open Cloudflare's **Workers & Pages** page.
3. Select **Create application → Pages → Connect to Git**.
4. Select the repository and production branch. Enter the settings below.
5. Select **Save and Deploy**. Share the production URL after deployment succeeds.

| Setting | Value |
| --- | --- |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |
| Node.js version | `22`, selected by `.node-version` |
| Build variable | `SKIP_DEPENDENCY_INSTALL=1` |

Cloudflare builds the site after later pushes to the connected production branch.
Users can open the same URL without running local commands.

Cloudflare publishes only `dist`. The website needs no Python server or server secrets.
The `_headers` file defines the browser security policy.

Cloudflare offers free static hosting within its published limits.
A custom domain has separate registration and renewal fees.
To use a custom domain, register an available name.
Add it under the Pages project's **Custom domains**. Follow Cloudflare's DNS instructions.
Deployment does not register a domain automatically.

Provider instructions: [Git deployment](https://developers.cloudflare.com/pages/get-started/git-integration/),
[build environment](https://developers.cloudflare.com/pages/configuration/build-image/),
[custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/),
[static hosting prices](https://developers.cloudflare.com/pages/functions/pricing/),
and [limits](https://developers.cloudflare.com/pages/platform/limits/).

## Build and check locally

These commands are for developers. They are not required to use the hosted app.
Use Node.js 22 or later. The browser app has no package-manager runtime dependencies.

```bash
npm ci
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:8080` on the computer that runs the preview.
The preview stops when its process stops.

Python provides a reference solver and an optional local API.
Use the project's `.venv` for Python checks:

```bash
uv sync --extra test
uv run pytest
uv run uvicorn wire_min_splitter.main:app --app-dir src --reload
```

The existing `dev` extra remains available. Use `test` for the complete Python check environment.
Do not synchronize project dependencies into a shared Python environment.

## Money rules

Amounts use a currency with two decimal places.
Source amounts and multipliers use exact decimal arithmetic.
The browser solver uses rational values and `BigInt` for money.

```text
ideal net = spent - total spent / participant count + extra_get - extra_pay
```

Positive net balances receive money. Negative net balances pay money.
Pay/get totals must match before multiplication or rounding.
Spending must be nonnegative.
Names must be nonempty and unique after whitespace removal at the ends and Unicode normalization.

The solver rounds final balances with these rules:

1. Round each exact balance down to whole cents.
2. Allocate the remaining cents to the largest fractional remainders.
3. Resolve equal remainders by name in Unicode code-point order.

Balances sum to zero. Each balance differs from its ideal value by less than one cent.
Participants with identical inputs can receive balances one cent apart.
Reordering named participants does not change the allocation.
Other units show approximate values and carry a notice.

The **Original** view calculates the source amounts independently, before multiplication.
For spending `[1.00, 0]` and `multiplier=0.01`, its payment remains `0.50`.
The solver does not reconstruct Original from rounded multiplied payments.

Cent rounding can make only one strict-mode view feasible.
Each view shows its own plan or error.
For spending `[2, 3, 3]`, no preferred payers, and `multiplier=0.01`, the multiplied plan remains visible.
Original shows its strict-mode error. Invalid inputs and resource failures remain calculation errors.

The optimizer minimizes `(transfer count, burden penalty)` in that order.
Burden counts each unselected payer's outgoing transfers beyond the first.
Strict mode applies its limits before the solver chooses the optimum.
A successful complete search proves the optimum for the rounded balances.
A canceled or failed search does not prove the optimum.

## Optional local API

The Python server provides `POST /api/settle` and `GET /api/health`.
The hosted website calculates in the browser and does not call this API.

```json
{
  "people": [
    {"name": "Alice", "spent": "120.00", "extra_pay": "0", "extra_get": "0"},
    {"name": "Bob", "spent": "0", "extra_pay": "0", "extra_get": "0"}
  ],
  "preferred_multi_payers": ["Bob"],
  "strict_preference": false,
  "multiplier": "1"
}
```

Send monetary JSON values as decimal strings to preserve precision.
The API also accepts exact JSON integers. It rejects fractional JSON numbers.
Send `"spent": "12.50"` instead of the previously accepted `"spent": 12.5`.

A successful result contains `summary`, `balances`, and `transfers`.
Monetary values are decimal strings.
A multiplied request also returns an independently calculated `original` result.

Either multiplied view can contain `{"error": {"message": "...", "resource": false}}` when its strict plan is infeasible.
The other view keeps its valid plan.
Check each view for `error` before reading `summary` or `transfers`.
With multiplier 1, strict infeasibility returns HTTP 400.
