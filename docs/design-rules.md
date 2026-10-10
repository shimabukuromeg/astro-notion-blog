# Primer Brandを軸にブログを作る

GitHub Blogを参考に、読み物が主役の構成にします。見出し・カード・リンク・フォームはPrimer Brand UI、検索ダイアログなどBrandにない操作はPrimer Product UIで補います。ブログ固有のレイアウトは公式トークンで作ります。

## インストール済みのAPIを基準にする

この実装では `@primer/react-brand` 0.57.2、`@primer/react` 38.40.1、`@primer/primitives` 11.10.0を使います。Brandのローカル参照リポジトリは `/Users/meg/work/memo/.tmp/primer-brand`、参照時のmainは `f624056` です。mainと公開ドキュメントには、インストール済み版にないAPIもあります。利用できるpropとトークンはパッケージの型定義・CSSでも確認します。

Brandの公式main.cssとfonts.cssを読み込みます。Mona Sansが対応しない日本語は、公式フォントスタックのシステムフォントで表示します。AstroのSSRではProductを `vite.ssr.noExternal` に指定します。Brand 0.57.2はUMD形式なので、開発時はNodeに読み込ませ、本番ビルド時だけViteプラグインでnoExternalに追加してRollupに変換させます。ブラウザ側は事前バンドル対象に含めます。

## コンポーネントと独自UIを使い分ける

OGPは1200×630pxの独自レイアウトです。SatoriではCSSを持つBrandコンポーネントをそのまま描画できないため、インストール済みBrandの公式CSSからライトテーマと1200px幅のトークンを解決します。タイトル中心の構成を基本に、FeaturedImageまたは読書記事の最初の書影があれば画像付きにします。実際のフォントで単語幅とタイトルの高さを計測し、公式の見出しサイズを段階的に切り替えます。画像取得に失敗した場合はタイトル中心に戻します。サイト共通のOGPも同じ生成処理を使います。

| UI                       | 構成と理由                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ヘッダー・カテゴリーナビ | ロゴの独自リンク、Brand InlineLinkとButton。現在のカテゴリーはaria-currentで示します。カテゴリーが多いため一覧は検索可能なダイアログに分けます。                                                                                                         |
| 注目記事・横型の記事紹介 | 独自のEditorial Story。Brand Heading・Text・InlineLinkに、日付、著者、リンク付きカテゴリー、コンパクトな画像枠を組み合わせます。標準Cardの内部には独自要素を押し込みません。                                                                             |
| アーカイブの記事カード   | Brand Cardのminimal・fullWidthと、公式Card.Label・Heading・Description。標準Cardは複数の記事で使い、1件だけの一覧はEditorial Storyで表示します。                                                                                                         |
| 記事の表紙               | FeaturedImageがある記事はその画像。ホーム先頭7件の読書記事では本文の書影を再利用し、それ以外で画像がない記事はカテゴリー・日付とOcticonを使った独自の装飾。枠、背景、文字、余白にはBrand/baseトークンを使います。装飾は支援技術とTab移動から除外します。 |
| 記事ヘッダー・目次       | Brand Breadcrumbs・Heading・InlineLink。本文の階層とスクロール位置を扱う目次は独自UIです。                                                                                                                                                               |
| Notion本文               | ネストしたブロックやReactのクイズを含む既存レンダラーにBrandの本文・見出しトークンを適用します。Proseに渡すHTML文字列へ平坦化しません。日本語の長文にはPrimerのloose行間を使います。                                                                     |
| 検索・カテゴリー一覧     | Product Dialog・FormControl・TextInput・ActionList・NavList。Brandにはこの版でDialogがありません。IconButtonもProductを使います。                                                                                                                        |
| ページ送り               | Product Pagination。この版のBrand Paginationには日本語ラベル用APIがないため、公開renderPageで翻訳できるProductを使います。                                                                                                                               |
| クイズ                   | 独自のdetailsカードにBrand RadioGroup・CheckboxGroup・FormControl・Radio・Checkbox・Buttonを組み合わせます。採点結果はProduct Bannerと意味のある状態色で表示します。                                                                                     |
| コードコピー             | Brand Button。Reactの状態でコピー結果を表示します。                                                                                                                                                                                                      |

Dialogの閉じるラベルは、Productの公開renderHeaderで日本語化します。公式Header・Title・IconButtonと標準の余白を保ち、フォーカストラップ、Esc、フォーカス復帰は公式実装に任せます。

## トークンと意味を守る

- ヘッダーのプロフィール写真はfaviconと同じ `public/favicon.ico` を参照します。Brand Avatarの公開propで丸形とレスポンシブサイズ（スマホ32px・PC48px）を指定し、余白にはbaseトークンを使います。画像はタイトル付きホームリンクの装飾として空のaltにします。
- Brand部分の文字・背景・境界線には `--brand-color-*`、文字組みにはBrand Heading / Textまたは `--brand-text-*` / `--brand-heading-*` を使います。
- 余白は `--base-size-*`、角丸・枠線・フォーカスはBrandトークンを使います。記事幅、画像の比率、レスポンシブの列数はコンテンツに応じた制約として定義できます。
- 公式コンポーネントは公開propやclassNameで構成します。内部クラス、data-component、内部DOMの書き換えによる見た目の調整は行いません。
- Brandの緑のアクセントを正解と混同しません。クイズの選択はProductのaccent、正解はsuccess、誤りはdangerを使い、文字とアイコンを併記します。採点後は無効な入力ではなく通常の文字色で読める回答一覧にします。
- Notion本文の著者による色注釈と構文色にはPrimerのdisplay / semanticトークンを使います。KaTeX、Mermaid、iframe内部はそれぞれのレンダラーが所有します。
- 見出しのHTML階層と表示サイズを分けて指定します。キーボード操作、テーマ変更、長いタイトルの折り返し、320pxからのレイアウトを確認します。

## 参照する公式資料

- [PrimerのProduct UIとBrand UI](https://primer.style/)
- [Brand UIの導入](https://primer.style/brand/getting-started/)
- [Brand Heading](https://primer.style/brand/typography/Heading/)
- [Brand Card](https://primer.style/brand/components/Card/)
- [Brand Prose](https://primer.style/brand/components/Prose/)
- [Primer Brandのソース](https://github.com/primer/brand)
- [GitHub Blog](https://github.blog/): 横型ナビゲーション、注目記事、読み物を中心とした余白と情報階層の参考。

このルールはプロジェクトの実装基準です。GitHub Blogの全要素が公開コンポーネントであることや、Primerの公式認定、賞の審査への合格を意味しません。以前のProduct/Docs版のスクリーンショットやLighthouse結果は今回のBrand版の検証結果と分けます。

## Brand版の検証状況

2026年10月10日の最終ソースで、全70ページのビルド、Astro / TypeScript / TSXのESLint、Reactコンポーネントの型検査、git diffの空白検査が通りました。生成HTMLには重複ID、canonicalの欠落・重複、参照先のないローカル画像、無効なページ送りリンクはありません。共有CSSの未定義トークン、数値による独自の文字サイズ・太さ・行間、Primer内部クラスを狙うセレクターも0件です。

静的検査結果はワークスペースの `output/primer-redesign/brand-static-audit.json` に保存しています。ブラウザで320・390・768・1280px幅、ライト・ダークテーマ、検索の全角正規化、カテゴリー絞り込み、ページ送り、単一記事カテゴリー、目次、クイズの正解・誤答・解説・再回答とフォーカス移動、コードコピーを確認しました。本番成果物でも検索・カテゴリー・クイズが動作し、Notion編集リンクが表示されないことを確認しています。実機や全ブラウザでの検査、Brand版のLighthouse計測は今回の対象に含めていません。

## GitHub Blogのレイアウトに合わせる

ヘッダー・特集・Latestはページ全体のテーマに従うキャンバス背景にし、ライトモードでは白背景で読み物を見せます。ヘッダーはプロフィール写真とタイトルに絞り、文字色にはBrandのdefault、区切りにはsubtleの意味トークンを使います。文字と操作のテーマは共通のBrand / Product ThemeProviderを継承します。スマホは特集・Latestとも画像を縦に並べ、著者・概要を残します。PCの特集右側では横型の記事紹介を使います。スマホのカテゴリーナビはメニュー内に置きます。

独自のセクション区切り線はbase-size-4とBrandのthin、カテゴリーの文字色はBrandのtext-defaultを使います。ライトモードでは黒系、ダークモードでは白系になります。リンクのホバー時の下線とフォーカス表示は残します。GitHub Blogのブランドイラストをコピーせず、記事の実際の書影や表紙を表示します。

GitHub Blogとの見た目の距離を作るため、白いヘッダーと著者のプロフィール写真を組み合わせています。記事の情報階層、余白、レスポンシブの構成は維持します。
