# OGP用フォント

OGPはビルド時にこのディレクトリのフォントを読み込みます。ブラウザには配信しません。Google Fontsへの毎回のリクエストをなくし、ビルド環境に日本語フォントがなくても生成できます。

- Mona Sans Regular / SemiBold: [GitHubの公式静的TTF](https://github.com/github/mona-sans/tree/main/fonts/static/ttf)。欧文にはPrimerと同じMona Sansを使います。
- Noto Sans JP 450 / 600: [Google Fontsの公式可変TTF](https://github.com/google/fonts/tree/main/ofl/notosansjp)から、FontToolsの`instantiateVariableFont`で各ウェイトを固定し、WOFFへ変換しています。日本語本文にはPrimerのnormalに対応する450、見出しにはsemiboldの600を使います。グリフは削除していません。

Satoriのフォント登録は100刻みのため、日本語の450のアウトラインを400として登録し、本文のスタイルにはPrimerの450を指定します。

いずれもSIL Open Font License 1.1です。各フォントのライセンスを同梱しています。取得日は2026年10月10日です。
