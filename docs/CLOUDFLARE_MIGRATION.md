# Cloudflare Workers 移行手順書（Vercel からの完全移行）

INS サイト（`insbs.net`）を Vercel から Cloudflare Workers へ移行するための手順です。
リポジトリ側の実装は完了しています。以下は **Cloudflare / レジストラ / Vercel の設定作業** です。

作業順序は必ずこの順で行ってください。DNS を先に切り替えると、Worker が未デプロイのあいだサイトが落ちます。

---

## 0. 現状（移行前）の構成

| 項目 | 移行前 | 移行後 |
| :--- | :--- | :--- |
| ホスティング | Vercel（`@astrojs/vercel`） | Cloudflare Workers（`@astrojs/cloudflare`） |
| 静的ページ | Vercel Edge Network | Workers Static Assets（`dist/client`、651 ページ） |
| SSR ルート | Vercel Functions | Worker（`/admin/blog-manager/`、`/api/**`、`/auth`、`/callback`、`/wp1/**`、`/image-proxy`） |
| リダイレクト | `vercel.json`（227 件） | `public/_redirects`（206 件）＋ `ins-legacy-redirects` Worker（31 件） |
| DNS | Vercel DNS（`ns1/ns2.vercel-dns.com`） | Cloudflare DNS |
| `www` → apex | Vercel のドメイン設定 | `ins-legacy-redirects` Worker |
| ブログ記事 | `src/content/blog/**`（Git 管理・186 記事） | 同じ（リポジトリごと移行されるため作業不要） |
| ブログ画像 | `public/blog-images/**`（約 30MB） | 同じ（Workers Static Assets として配信） |

ブログ記事・画像はすべて Git リポジトリ内にあるため、**データ移行作業は不要**です。
ビルド出力に含まれ、Workers Static Assets として配信されます。

---

## 1. Cloudflare 側の事前準備

1. Cloudflare アカウントにログインし、**Add a site** で `insbs.net` をゾーンとして追加します。
2. Cloudflare が既存 DNS をスキャンします。**この時点ではネームサーバーを切り替えないでください。**
3. スキャン結果に以下が含まれているか確認し、足りないものは手で追加します（Vercel DNS 側の値は
   `dig` で確認できます）。
   - メール関連（MX / SPF / DKIM / DMARC）— **取りこぼすとメールが止まります。最優先で確認**
   - Google Search Console の TXT 検証レコード
   - その他 CNAME / TXT（SendGrid、各種検証用など）
   - `insbs.net` / `www` / `osak` / `hyg` / `siga` の A・CNAME は追加不要です（手順 3 で Worker の
     カスタムドメインとして自動作成されます）

   移行前の値は以下で取得できます。

   ```bash
   for name in @ www osak hyg siga; do dig +noall +answer ANY ${name}.insbs.net @ns1.vercel-dns.com; done
   dig +noall +answer MX insbs.net @ns1.vercel-dns.com
   dig +noall +answer TXT insbs.net @ns1.vercel-dns.com
   ```

4. API トークンを発行します（**My Profile → API Tokens → Create Token**）。
   必要な権限:
   - Account / Workers Scripts : Edit
   - Account / Workers KV Storage : Edit（セッション用 KV の自動作成に必要）
   - Zone / Workers Routes : Edit（`insbs.net`）
   - Zone / DNS : Edit（`insbs.net`、カスタムドメインの DNS 作成に必要）

---

## 2. GitHub Actions のシークレット登録

リポジトリの **Settings → Secrets and variables → Actions** に登録します。

| シークレット | 内容 |
| :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | 手順 1-4 のトークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare ダッシュボード右側の Account ID |

---

## 3. Worker のデプロイ（DNS 切り替え前）

ローカルから初回デプロイします。`wrangler login` 済み、または `CLOUDFLARE_API_TOKEN` を
環境変数に設定した状態で実行してください。

```bash
npm ci
npm run deploy                    # サイト本体（ins）
npm run deploy:legacy-redirects   # www / osak / hyg / siga のリダイレクト専用（ins-legacy-redirects）
```

- Worker が必要とする Cloudflare リソースは静的アセット（`dist/client`）だけです。KV・D1・R2 の事前作成は不要です。
  `Astro.session` はどこからも使っていないため `astro.config.mjs` で `sessionDrivers.null()` を指定しており、
  セッション用 KV 名前空間を作らなくてもデプロイできます（使う場合は `astro.config.mjs` のコメント参照）。
- `wrangler.jsonc` の `routes` に `custom_domain` を指定しているため、Cloudflare が
  `insbs.net` / `www` / `osak` / `hyg` / `siga` の DNS レコードをゾーンに自動作成します。
  **ネームサーバー切り替え前でもゾーン内にレコードが作られるだけなので、本番影響はありません。**

### Worker のシークレット登録

環境変数はすべて任意（未設定でも動作）ですが、本番同等にするには以下を登録します。

```bash
npx wrangler secret put ADMIN_PASSWORD               # 未設定時は admin123
npx wrangler secret put BLOG_PUBLISH_GITHUB_TOKEN    # 未設定時は記事保存がローカルモードになる
npx wrangler secret put DECAP_GITHUB_CLIENT_ID       # /admin/（Decap CMS）ログイン用
npx wrangler secret put DECAP_GITHUB_CLIENT_SECRET
```

`DECAP_SITE_URL` / `BLOG_PUBLISH_GITHUB_REPO` / `BLOG_PUBLISH_GITHUB_BRANCH` は
`wrangler.jsonc` の `vars` に平文で入っているため、登録不要です。

---

## 3.5 Workers Builds（Git 連携での継続デプロイ）

Cloudflare ダッシュボードの **Workers & Pages → ins → Settings → Build** でリポジトリを接続すると、
push ごとに Cloudflare 側でビルドとデプロイが走ります（GitHub Actions を使わない場合はこちら）。
非本番ブランチと PR には Worker Previews のプレビュー URL が自動発行されます。

| 設定項目 | 値 |
| :--- | :--- |
| Git repository | `fins250903-arch/INS` |
| Production branch | `main` |
| Root directory | `/`（空欄） |
| Build command | 空欄 |
| Deploy command | `npx wrangler deploy`（ダッシュボードのデフォルトのままで可） |
| Non-production branch deploy command | `npx wrangler versions upload`（デフォルトのままで可） |

`wrangler.jsonc` の `build.command`（`scripts/cf-workers-build.mjs`）が `astro build` を実行してから
生成物を wrangler が見つけられるパスへコピーします。そのため Build command は空欄で、
Deploy command は Cloudflare のデフォルト（`npx wrangler deploy`）のままで通ります。
Build command に `npm run build` を入れると同じビルドが 2 回走ります。

`npm run deploy` / `npm run deploy:preview` は同じ wrangler コマンドです（カスタムビルドが先に走ります）。

いずれの構成でも **ビルドがデプロイより先に実行されること**が条件です。`astro build` が
`dist/server/entry.mjs` と `.wrangler/deploy/config.json`（`wrangler.jsonc` からのリダイレクト設定）を
生成し、`wrangler deploy` はそれを読んで実際の Worker 本体と静的アセット（`dist/client`）を決めます。

- Node.js は直下の `.node-version`（`22`）で固定しています。Workers Builds のデフォルトは Node 24、
  `package.json` の `engines` は `>=22.12.0` です。
- `ins-legacy-redirects` は別 Worker です。Workers Builds で扱うなら **2 つ目のプロジェクト**として同じ
  リポジトリを接続し、Deploy command に `npm run deploy:legacy-redirects`（非本番は
  `npm run deploy:legacy-redirects:preview`）を設定します。
- GitHub Actions のワークフロー（`.github/workflows/deploy-cloudflare.yml`）は `CLOUDFLARE_API_TOKEN` が
  未登録ならデプロイ手順をスキップし、検証とビルドだけを行います。Workers Builds と二重にデプロイしたく
  ない場合は、手順 2 のシークレットを登録しないでください。

---

## 4. 切り替え前の検証（DNS を変えずに確認）

`*.workers.dev` か、Cloudflare 上の一時ホスト名で以下を確認します。

```bash
# ローカル（workerd）での検証。本番と同じランタイムで動きます
npm run build
npm run preview        # http://localhost:8787
npm run cf:redirects:verify
```

確認項目:

- 主要 LP（`/`, `/osaka/`, `/hyougo/`, `/aiti/` …）が 200 で表示崩れがない
- ブログ一覧・記事（`/blog/`, `/blog/<region>/<slug>/`）が 200
- 画像（`/_astro/*.webp`, `/blog-images/*.jpg`）が 200
- リダイレクト（`/` → `/osaka/`、`/hirosima/` → `/`、`/wp1/...`、`/ok2/...`）
- 管理画面（`/admin/blog-manager/`）でログイン・記事一覧・保存ができる

---

## 5. DNS 切り替え（ネームサーバー変更）

1. Cloudflare が案内するネームサーバー（例 `xxx.ns.cloudflare.com`）を **レジストラ** 側で設定します。
   現在は `ns1.vercel-dns.com` / `ns2.vercel-dns.com` です。
2. 反映（通常数分〜数時間、最大 48 時間）を待ち、Cloudflare ダッシュボードのゾーンが **Active** に
   なることを確認します。
3. TTL の関係で切り替え中は Vercel と Cloudflare の両方に振り分けられます。**この期間中は Vercel の
   プロジェクトを削除しないでください。**

```bash
dig +short NS insbs.net
curl -sI https://insbs.net/ | grep -i "server\|cf-ray"   # cf-ray が出れば Cloudflare 配信
```

---

## 6. 切り替え後の本番検証

```bash
# 全 LP / ブログの HTTP ステータスとリダイレクトの一括確認
node scripts/verify-deployment.mjs https://insbs.net
```

加えて以下を確認します。

- Google Search Console でドメインプロパティの検証が維持されている（TXT レコード）
- `sitemap-index.xml` / `sitemap-0.xml` が 200
- メール送受信（MX を移行できているか）

---

## 7. Vercel 側の削除（ここまで問題がなければ）

**DNS 切り替えから 1 週間以上、かつ手順 6 の検証が全て通ってから実施してください。**

1. Vercel プロジェクトのドメイン（`insbs.net`, `www`, `osak`, `hyg`, `siga`）を削除
2. Vercel DNS のゾーン `insbs.net` を削除（ネームサーバーが Cloudflare に向いていることを再確認）
3. Vercel プロジェクト `ins` を削除
4. GitHub の Vercel App 連携（Integrations）を解除

削除前チェックリスト:

- [ ] `dig +short NS insbs.net` が Cloudflare のネームサーバーのみを返す
- [ ] `curl -sI https://insbs.net/` の応答に `cf-ray` があり `server: Vercel` がない
- [ ] `scripts/verify-deployment.mjs` が本番 URL に対して全件成功
- [ ] MX / SPF / DKIM / DMARC / GSC TXT が Cloudflare DNS に存在する
- [ ] 管理画面からの記事保存（GitHub コミット）が成功する
- [ ] GitHub Actions の `Deploy to Cloudflare Workers` が成功している

---

## トラブルシューティング

### `astro add cloudflare` が走ってデプロイが失敗する

```
🛠️  Configuring project for Astro with "astro add cloudflare"
  ▲  Error installing dependencies.
   The command `npm i @astrojs/cloudflare@^14.3.2 wrangler@^4.136.2` exited with code 1
  Astro could not update your astro.config.js file safely.
Failed: error occurred while running deploy command
```

`wrangler deploy` がリポジトリ内に Workers の設定ファイルを見つけられなかったときだけ走る
「フレームワーク自動セットアップ」の失敗です。ビルド対象のコミットに `wrangler.jsonc` と
`@astrojs/cloudflare` が入っていないことが原因で、自動セットアップ自体は本来不要です
（設定はこのリポジトリに入っています）。

確認する順序:

1. Workers Builds の **Production branch** が Cloudflare 対応済みのブランチ（`main`）になっているか。
   Vercel 構成のまま（`vercel.json` と `@astrojs/vercel` だけ）のコミットをビルドすると必ずこれになります。
   → 移行 PR を `main` にマージしてから **Retry build** してください。
2. **Root directory** が `/` になっているか。サブディレクトリを指していると `wrangler.jsonc` を見つけられません。
3. Build command / Deploy command が手順 3.5 の表どおりか。`--no-autoconfig` を付けると自動セットアップ自体を
   無効化できます（`npm run deploy` には既に入っています）。

`wrangler.jsonc` があれば自動セットアップは走りません。ビルドを忘れている場合は、代わりに
`The entry-point file at "@astrojs/cloudflare/entrypoints/server" was not found.` という明示的な
エラーになります（「先に `npm run build` を実行してください」という意味です）。

このリポジトリは **Astro 6** です。`npx astro add cloudflare`（Wrangler の自動セットアップが呼ぶコマンド）は
現在 `@astrojs/cloudflare@^14` を入れようとしますが、adapter 14 の peer は `astro@^7.2.0` です。
そのため `main`（Vercel 構成のまま、`wrangler.jsonc` なし）を Workers Builds がビルドすると、必ず次で止まります。

```
npm error Found: astro@6.x
npm error Could not resolve dependency:
npm error peer astro@"^7.2.0" from @astrojs/cloudflare@14.3.3
The command `npm i @astrojs/cloudflare@^14.3.3 wrangler@^4.x` exited with code 1
```

`--legacy-peer-deps` で無理に入れても、Astro 7 用 adapter が Astro 6 のサイトを壊します。
**対処は自動セットアップを成功させることではなく、Cloudflare 設定済みのコミットをビルドすることです。**

- この移行 PR を `main` にマージしてから **Retry build** する
- または Workers Builds の **Production branch** をこのブランチ
  （`cursor/migrate-vercel-to-cloudflare-workers-f405`）に切り替える

ダッシュボードの Deploy command は `npx wrangler deploy`（デフォルト）のままでも、
`wrangler.jsonc` があるコミットなら自動セットアップは走りません。`npm run deploy` の方が
`--no-autoconfig` 付きでより安全です。

### `SESSION bindings must have an "id" field`

`@astrojs/cloudflare` は既定で `Astro.session` を Cloudflare KV に載せ、生成する wrangler 設定に
`id` のない `SESSION` KV バインディングを追加します。`wrangler deploy` / `wrangler versions upload` は
`id` のない KV バインディングを拒否するため（`--dry-run` では発覚しません。既存の値を継承する扱いになるためです）、
ビルドは通るのにアップロードだけが失敗します。

このリポジトリはセッションを使っていないので `astro.config.mjs` で `sessionDrivers.null()` を指定し、
KV バインディング自体を作らないようにしてあります。セッションを使う場合は名前空間を作り、`id` を書いてください。

```bash
npx wrangler kv namespace create SESSION   # 出力された id を wrangler.jsonc の kv_namespaces に追記
```

```jsonc
// wrangler.jsonc
"kv_namespaces": [{ "binding": "SESSION", "id": "<作成された id>" }]
```

あわせて `astro.config.mjs` の `session` を `sessionDrivers.cloudflareKVBinding()` に戻します。

### `There is a deploy configuration at ".wrangler/deploy/config.json" ... does not exist`

`astro build` の出力（`dist/`）だけを消して `.wrangler/` を残した状態です。`npm run build` を再実行するか、
`.wrangler/deploy/config.json` を削除してください。

### プレビュー URL（`*.workers.dev`）が検索結果に出てしまう

ページの canonical は常に `https://insbs.net` を指しますが、DNS 切り替えが完了して検証も終わったら
`wrangler.jsonc` に `"workers_dev": false` を追加して本番 Worker の `*.workers.dev` を閉じるのが確実です
（Worker Previews のプレビュー URL は別設定なので残ります）。

---

## 実装メモ（移行で変わった挙動）

- **リダイレクトのステータス**: Vercel の `permanent: true` は 308 を返していたため、`_redirects` でも
  308 を維持しています。
- **`/blog/<region>/<slug>` の扱い**: 末尾スラッシュなしは `/blog/<slug>` へ 308、末尾スラッシュ付きは
  記事ページを 200 で配信。Vercel と同じ挙動になるよう、`_redirects` 側は `*`（複数セグメント）ではなく
  `:slug`（1 セグメント・末尾スラッシュ非マッチ）で表現しています。
- **レガシーサブドメイン**: Vercel では末尾スラッシュ付き URL がリダイレクトされず apex と同じページを
  配信していました（重複コンテンツ）。移行後は必ず `https://insbs.net` 側へ 308 します。
- **`hyg.insbs.net/` / `siga.insbs.net/`**: 以前は `/osaka/` へ飛んでいましたが、移行後はそれぞれ
  `/hyougo/` `/siga/` へ飛びます。
- **ビルド時の日付**: `prerenderEnvironment: 'node'` を指定しています。`workerd` は最初の I/O まで時計が
  エポックで止まるため、`dateModified` などが `1970-01-01` になるのを避けるためです。
- **画像最適化**: `imageService: 'compile'` により、`<Image />` はビルド時に sharp で WebP 化されます
  （Vercel 時代と同じ成果物）。SSR ルートのみ元画像をそのまま返します。
