# MoneySplit

MoneySplit splits shared expenses and finds the fewest transfers that settle them.
Open [moneysplit-e1m.pages.dev](https://moneysplit-e1m.pages.dev/) in any browser. You need no account and no installation.

Languages: [한국어](README.ko.md) · [日本語](README.ja.md) · [中文](README.zh.md)

## Use

1. Enter each person's name and Spent amount.
2. Optional: enter Extra Pay and Extra Get. Their totals must be equal.
3. Mark each person who may send more than one transfer as Preferred Multi-Payer.
4. Optional: turn on Strict preference mode. Then only marked people can send more than one transfer.
5. Read the transfers. Use Copy Results or Screenshot to share them.

The app calculates in your browser. It sends no names or amounts to a server.
A supporting browser can install the app. The app works offline after the browser caches all app files.
A large group can make the search slow. Select Cancel to stop it.

## How it works

The app computes each balance in whole cents. Then an exact search finds the plan with the fewest transfers.
[docs/ALGORITHM.md](docs/ALGORITHM.md) explains each step and proves that the plan is optimal.
The app shows the same text under **How the algorithm works**.

## Develop

Use Node.js 22 or later.

```bash
npm ci
npm test
npm run build
npm run preview  # serves dist/ at http://127.0.0.1:8080
```

To change the algorithm text, edit `scripts/algorithm-content.mjs`. Then run `npm run docs:algorithm`.
That command updates the app and `docs/ALGORITHM*.md` together. `npm test` fails if they differ.

Python has a reference solver and an optional local API. Use the project's `.venv`:

```bash
uv sync --extra test
uv run pytest
```

## Deploy

Each push to `main` deploys the site.
The `Release checks` workflow runs the tests, builds `dist`, and uploads it to the Cloudflare Pages project `moneysplit`.
The job fails if Cloudflare records a preview deployment instead of a production deployment.

The workflow reads two repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token with **Account → Cloudflare Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | ID of the Cloudflare account that owns `moneysplit` |

To deploy by hand, run `npm run build`. In Cloudflare, open `moneysplit` and select **Create a new deployment**.
Choose **Production** and upload `dist`.

## Local API

`uv run uvicorn wire_min_splitter.main:app --app-dir src` serves `POST /api/settle` and `GET /api/health`.
The website does not use this API.

```json
{
  "people": [{"name": "Alice", "spent": "120.00"}, {"name": "Bob", "spent": "0"}],
  "preferred_multi_payers": ["Bob"],
  "strict_preference": false,
  "multiplier": "1"
}
```

Send amounts as decimal strings or integers. The API rejects JSON numbers with a fraction part.
The result has `summary`, `balances`, and `transfers`. A multiplier other than 1 adds an `original` result.
In strict mode, either result can be `{"error": {...}}` instead of a plan.
With multiplier 1, a strict no-plan result returns HTTP 400.
