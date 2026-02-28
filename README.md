# Wire-Min-Splitter (최소송금 N빵 계산기)

`Wire-Min-Splitter` is a Python-first web app that computes fair party settlement with a minimum number of transfers.

Also known as:
- Korean: `최소송금 N빵 계산기`
- Japanese: `最小送金バラバラ割り勘`
- Chinese: `最少转账AA计算器`

## Documentation Languages

- English (this file): `README.md`
- Korean: [README.ko.md](README.ko.md)
- Japanese: [README.ja.md](README.ja.md)
- Chinese: [README.zh.md](README.zh.md)

## Current Features

- Minimum-transfer optimization (`payer -> receiver` instructions)
- Burden preference:
  - soft preference (tie-break penalty)
  - strict preference mode
- Inputs per person:
  - `spent` (default `0`)
  - `extra_pay` (default `0`)
  - `extra_get` (default `0`)
- `repeat` per row (default `1`) to represent multiple identical participants
- Drag-and-move row reordering (enabled by default)
- Participant count input + apply button
- Name reset modes:
  - empty
  - `human 01, 02, ...`
  - alphabetical (`A, B, C, ...`)
- Warning dialog before erasing edited names
- UI language switch (top-right): English / Korean / Japanese / Chinese

## Settlement Rules

Base split is equal across all participants.

`net = spent - share + extra_get - extra_pay`

- `net > 0`: person receives
- `net < 0`: person pays
- `net = 0`: settled

Feasibility condition:

`sum(extra_get) == sum(extra_pay)`

## Fair-Cents Policy

To avoid row-order artifacts in cent rounding:
- Participants with identical inputs are normalized to identical net cents when difference is only rounding noise.
- Any residual cent is absorbed by the strongest receiver/payer.

Example fixed behavior:
- 9 people, one spent `151`, others `0` -> all 8 payers send identical `16.78`.

## Quick Start

```bash
uv sync
uv run uvicorn wire_min_splitter.main:app --app-dir src --reload
```

Open: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Run Tests

```bash
uv run pytest
```

## API

`POST /api/settle`

Request body:

```json
{
  "people": [
    { "name": "Alice", "spent": "120.00", "extra_pay": "0", "extra_get": "0" },
    { "name": "Bob", "spent": "0.00", "extra_pay": "0", "extra_get": "0" }
  ],
  "preferred_multi_payers": ["Alice"],
  "strict_preference": false
}
```

Response:
- `summary` (`transactions`, `burden_penalty`)
- `balances` (name, net, role)
- `transfers` (`from`, `to`, `amount`)
