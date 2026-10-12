# Wire-Min-Splitter / MoneySplit

Run `npm run build`, then `npm run preview`. Open <http://127.0.0.1:8080>.

MoneySplit is a static expense calculator. It computes balances and finds the fewest payer-to-receiver transfers on your device. No account, database, payment service, or Python server is required by the website. Names and amounts are not sent to a calculation server.

The interface supports English, Korean, Japanese, and Chinese. It keeps participant repeats, drag reordering, multiplier views, copy, and PNG screenshots. The screenshot library is bundled locally.

## Calculate and install

1. Enter a name and spending for each participant. Optional pay/get adjustments must have exactly equal totals.
2. Select participants who can make multiple payments. Soft mode minimizes transfers first, then the burden on other payers. Strict mode permits multiple outgoing transfers only for selected payers.
3. Read the exact payment instructions. Other display units are approximate views and are labeled accordingly.

Exact optimization compares combinations of payments. It can take a long time. A calculation runs in a Web Worker so the interface remains usable. Use **Cancel** to stop it. There is no automatic time limit. Cancellation does not establish that a settlement is impossible.

After the browser installs the offline cache, the PWA can work offline. Install it through a supporting browser to get a separate app window on macOS, Windows, or Linux. Native installers through Tauri are deferred. Browser storage eviction can remove the offline copy.

## Monetary rules

The current currency has two decimal places. Input amounts and multipliers use exact decimal arithmetic. The browser solver uses rational values and `BigInt`, not floating-point money.

`ideal net = spent - total spent / participant count + extra_get - extra_pay`

Positive net balances receive money. Negative net balances pay money. Pay/get adjustment totals must match **before** multiplication or rounding. Spending must be nonnegative. Names must be nonempty and unique after trimming and Unicode normalization.

Final balances use balanced cent rounding: floor each exact net in cents, then allocate the remaining cents to the largest fractional remainders. Names resolve ties in Unicode code-point order. Balances sum to zero. Each balance differs from its ideal value by less than one cent. Identical inputs can differ by one cent. Reordering named participants does not change the allocation.

Example: spending `151.00` across nine participants previously forced all eight payers to pay `16.78`. Balanced allocation now assigns a nearest-cent share while preserving the total. The exact one-cent allocation follows the name tie-break.

The **Original** view solves the original amounts independently. With spending `[1.00, 0]` and multiplier `0.01`, the original payment remains `0.50` even when the converted cent settlement differs. It is not reconstructed by dividing rounded converted payments.

In strict mode, rounding can make only one view feasible. Each view shows its own plan or error. For spending `[2, 3, 3]` and `multiplier=0.01`, the multiplied plan stays visible when the Original has no strict plan. Invalid inputs and resource failures remain calculation errors.

The optimizer minimizes `(transfer count, burden penalty)` in that order. Burden is the number of outgoing transfers beyond one for each nonpreferred payer. Strict mode imposes its constraints before choosing the optimum. A completed successful search establishes the optimum for the rounded balances. A canceled or failed search does not.

## Development and verification

Node.js 22 or later is required for the build and tests. The browser app has no package-manager runtime dependencies.

```bash
npm ci
npm test
npm run build
npm run preview
```

Python remains a reference solver and optional local API. Use the project `.venv`:

```bash
uv sync --extra test
uv run pytest
uv run uvicorn wire_min_splitter.main:app --app-dir src --reload
```

The legacy `dev` extra remains available. It is not the complete release-verification environment. Never synchronize project dependencies into a shared Python environment.

## Deploy to Cloudflare Pages

1. Push the reviewed release to GitHub. In Cloudflare, select **Workers & Pages → Create application → Pages → Connect to Git**.
2. Select the repository and production branch. Use **Framework preset: None**, **Build command: `npm run build`**, **Build output directory: `dist`**, and the repository root as the root directory. The `.node-version` file selects Node.js 22. Set `SKIP_DEPENDENCY_INSTALL=1` in the Pages build variables. This dependency-free build needs no Python installation.
3. Deploy. Cloudflare assigns a public `*.pages.dev` URL. Anyone with the URL can open the calculator.
4. Optional: register an available domain and add it under the Pages project's **Custom domains**. A domain has its own registration and renewal fee. Follow Cloudflare's DNS instructions for the chosen domain.

Only `dist` is published. Python source, tests, repository metadata, and dependencies stay out of the deployment. No server secrets are needed. `_headers` supplies the site's content security policy.

Cloudflare Pages offers free static hosting within its published limits. Custom-domain availability and provider terms can change. Deployment preparation does not register a domain or publish the site.

Provider references: [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/), [build environment](https://developers.cloudflare.com/pages/configuration/build-image/), [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [limits](https://developers.cloudflare.com/pages/platform/limits/).

## Local API

The optional Python reference provides `POST /api/settle` and `GET /api/health`. The public Cloudflare website uses the local browser solver instead.

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

Send monetary JSON values as decimal strings to preserve precision. The local API also accepts exact JSON integers. It rejects fractional JSON numbers. The response contains `summary`, `balances`, and `transfers`, with monetary values as decimal strings. Multiplied requests also return the independently calculated `original` result.

A multiplied request can return `{"error": {"message": "...", "resource": false}}` for either infeasible view. The other view retains its valid plan. Clients must check each view for `error` before reading `summary` or `transfers`. A request with multiplier 1 retains HTTP 400 for strict infeasibility.

The previous API accepted fractional JSON numbers. Send `"spent": "12.50"` instead of `"spent": 12.5` after this release.

Localized introductions: [한국어](README.ko.md), [日本語](README.ja.md), [中文](README.zh.md).
