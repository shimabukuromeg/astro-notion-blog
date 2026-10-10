# Primer版のブログを確認する

`codex/primer-redesign` ブランチで、トップ・記事詳細・カテゴリー・ページ送りをPrimerに置き換えています。Notionの記事取得と本文のブロック表示は既存の仕組みを使います。

## ローカルプレビューを起動する

Node.js 20で依存パッケージをインストールします。既存の `re2` などのネイティブ依存は、Node.js 26ではインストールに失敗する場合があります。

```sh
npm install
node --env-file=.env node_modules/astro/astro.js dev --host 127.0.0.1 --port 4322
```

`.env` に既存の `DATABASE_ID` と `NOTION_API_SECRET` が必要です。プレビューは [http://127.0.0.1:4322](http://127.0.0.1:4322) で確認できます。

## 全記事をビルドする

既存のビルドフックも認証情報を参照するため、`.env` をプロセスの環境変数に読み込んで実行します。

```sh
node --env-file=.env scripts/blog-contents-cache.cjs
node --env-file=.env node_modules/astro/astro.js build
```

本番成果物のプレビューは、ビルド後に次のコマンドで起動できます。

```sh
node --env-file=.env node_modules/astro/astro.js preview --host 127.0.0.1 --port 4322
```

## デザインを調整する

実装の基準と独自UIの扱いは[デザインルール](./design-rules.md)を参照してください。

- `src/components/primer/PrimerShell.tsx`: ヘッダー、カテゴリー、検索ダイアログ、テーマ切り替え。
- `src/components/primer/PostList.tsx`: 記事一覧。
- `src/components/primer/BlogPagination.tsx`: 公式Paginationの日本語化。
- `src/components/primer/CodeCopyButton.tsx`: 公式Buttonによるコードのコピー。
- `src/components/primer/ArticleHeader.tsx`: 記事タイトル、日付、カテゴリー。
- `src/components/primer/ArticleToc.tsx`: 目次とスクロール位置の表示。
- `src/components/primer/QuizCard.tsx`: クイズの選択、採点、解説と再回答。
- `src/lib/quiz-helpers.ts`: Notionのクイズ形式の読み取りと採点。
- `src/styles/primer-blog.css`: レイアウト、公式トークンの読み込み、日本語本文の文字組み。
- `src/components/OgImage.tsx`: タイトル中心・画像付きのOGP生成。
- `src/lib/og-tokens.ts`: Primer BrandのトークンをOGP用に読み込む処理。

見出し・カード・リンク・フォームには `@primer/react-brand`、ダイアログ・ページ送り・採点結果には `@primer/react` を使います。Brandのトークンと `@primer/primitives`、`@primer/octicons-react` で独自UIを補います。記事本文は日本語の長文に合わせて行間を広げています。Notionの色注釈とコードの構文色もPrimerのテーマに連動します。

見た目はGitHub Blogを参考にしています。横型カテゴリーナビゲーション、大きな注目記事、コンパクトな関連記事、余白を生かした記事カードで構成しています。注目記事のカテゴリーはテキストリンク、記事カードは公式Card.Labelで表示し、記事本文の幅は最大760pxに抑えています。スマホでは記事を1列に並べ、カテゴリーと目次を開閉できます。

検索は公開記事のタイトル・概要・カテゴリーを対象にします。検索ボタン、または `⌘K` / `Ctrl+K` で開き、`Esc` で閉じます。

## Notionでクイズを書く

トグルのタイトルを `[quiz] Q1. 問題文` にします。トグル内に2つ以上のTo-doで選択肢を書き、正解の選択肢だけにチェックを入れます。選択肢以外の段落やブロックは、回答後に解説として表示します。

正解が1つならラジオボタン、複数ならチェックボックスになります。「回答する」で採点し、「正解を見る」で解説を確認できます。「もう一度解く」で選択と結果をリセットします。回答はブラウザー内で処理し、Notionのチェック状態は変更しません。

正解がない、選択肢が足りない、選択肢に子ブロックがある場合は、元のNotionトグルとして表示します。JavaScriptが無効の場合も、折りたたみから正解と解説を読めます。

## OGPを確認する

記事のOGPは `/og/<記事のSlug>.png`、ブログ全体のOGPは `/og.png` に生成します。FeaturedImageを優先し、未設定の読書記事は本文の最初の画像を使います。画像がない、または読み込めない場合はタイトル中心の構成になります。

OGPのフォントはビルド時だけ読み込み、ページ表示時には配信しません。出典とライセンスは `src/assets/fonts/README.md` に記録しています。

## 参照した公式ソース

- [Primer Brand](https://github.com/primer/brand): `f624056`。ローカル: `/Users/meg/work/memo/.tmp/primer-brand`。
- [Primer Primitives](https://github.com/primer/primitives): `f48bc06`。ローカル: `/Users/meg/work/memo/.tmp/primer-primitives`。
- [Primer React](https://github.com/primer/react): `7f5303d`。ローカル: `/Users/meg/work/memo/.tmp/primer-react`。
- [Primer Reactの導入手順](https://primer.style/product/getting-started/react/)
- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions): レイアウトと見出し、記事への導線の参考。
- [GitHub Docsのスタイル](https://github.com/github/docs/tree/main/src/frame/stylesheets): DocsもPrimerを基礎にしていることを確認。

インストールしたバージョンは `package-lock.json` に記録されています。AstroのSSRではProductをnoExternalに指定しています。UMD形式のBrand 0.57.2は開発時にNodeで読み込み、本番ビルド時はViteプラグインでnoExternalに加えてRollupで変換します。ブラウザ側は事前バンドルします。

## 全体レビュー

改善した箇所と検証結果は [デザインレビュー](design-review.md) にまとめています。Xの投稿は、記事内の「投稿を表示」を押したときに読み込みます。
