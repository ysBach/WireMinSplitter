# 最小送金バラバラ割り勘 (Wire-Min-Splitter)

パーティーや飲み会の精算で、**送金回数を最小化**しながら公平に割り勘計算を行う Python ベースのWebアプリです。

英語版ドキュメント: [README.md](README.md)

## 主な機能

- 送金回数最小化の精算計算（`payer -> receiver`）
- 複数送金の負担優先設定:
  - 緩和モード（同率解でペナルティ最小）
  - 厳格モード
- 参加者ごとの入力:
  - `spent`（初期値 `0`）
  - `extra_pay`（初期値 `0`）
  - `extra_get`（初期値 `0`）
- 行ごとの `repeat`（初期値 `1`）で同一条件の参加者をまとめて入力
- 行のドラッグ並び替え（初期状態で有効）
- 人数入力 + 適用ボタン
- 名前一括リセット:
  - 空欄
  - `human 01, 02, ...`
  - アルファベット（`A, B, C, ...`）
- 名前上書き前の警告ダイアログ
- UI言語切替: 英語 / 韓国語 / 日本語 / 中国語

## 精算ルール

均等割りベース:

`net = spent - share + extra_get - extra_pay`

- `net > 0`: 受け取り側
- `net < 0`: 支払い側
- `net = 0`: 精算済み

成立条件:

`sum(extra_get) == sum(extra_pay)`

## 端数（1セント）公平処理

丸めによる行順依存の不公平を減らすため:

- 入力が同一の参加者は、可能な限り同一の純額に正規化
- 残る1セント差は代表受取人/支払人に吸収

例: 9人中1人だけ `151` を支払い、他は 0 -> 残り8人の送金額は同一

## 実行方法

```bash
uv sync
uv run uvicorn wire_min_splitter.main:app --app-dir src --reload
```

ブラウザ: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## テスト

```bash
uv run pytest
```

## API

`POST /api/settle`

リクエスト例:

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

レスポンス:
- `summary`（`transactions`, `burden_penalty`）
- `balances`（name, net, role）
- `transfers`（`from`, `to`, `amount`）
