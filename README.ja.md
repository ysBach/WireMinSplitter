# 最小送金バラバラ割り勘 (MoneySplit)

MoneySplit は共同の支出を分け、精算に必要な送金回数を最小にします。
ブラウザで [moneysplit-e1m.pages.dev](https://moneysplit-e1m.pages.dev/) を開いてください。アカウントもインストールも不要です。

言語: [English](README.md) · [한국어](README.ko.md) · [中文](README.zh.md)

## 使い方

1. 各人の名前と支出を入力します。
2. 任意: 追加負担と追加受取を入力します。2 つの合計は等しくなければなりません。
3. 複数回送金してよい人に「複数送金の優先者」の印を付けます。
4. 任意: 厳格優先モードをオンにします。すると印を付けた人だけが複数回送金できます。
5. 送金指示を確認します。「結果をコピー」または「スクリーンショット」で共有します。

アプリはブラウザ内で計算します。名前や金額をサーバーに送りません。
対応ブラウザではアプリをインストールできます。ブラウザがアプリのファイルをすべてキャッシュした後は、オフラインでも動きます。
人数が多いと探索に時間がかかることがあります。「キャンセル」で止めます。

## 仕組み

アプリは各残高をセント単位の整数で計算します。次に、厳密な探索で送金回数が最も少ない計画を見つけます。
[docs/ALGORITHM.ja.md](docs/ALGORITHM.ja.md) に各手順と最適性の証明があります。
アプリの **アルゴリズムの仕組み** にも同じ内容があります。

## 開発と配信

Node.js 22 以上が必要です。

```bash
npm ci
npm test
npm run build
npm run preview  # dist/ を http://127.0.0.1:8080 で開きます
```

アルゴリズムの説明を直すには、`scripts/algorithm-content.mjs` を編集して `npm run docs:algorithm` を実行します。
このコマンドはアプリと `docs/ALGORITHM*.md` を一緒に更新します。両者が異なると `npm test` が失敗します。

`main` にプッシュすると、GitHub Actions がテストとビルドの後に Cloudflare Pages プロジェクト `moneysplit` へ配信します。
配信の設定、Python のチェック、ローカル API は [英語 README](README.md) を参照してください。
