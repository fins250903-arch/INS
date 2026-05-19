# Google Search Console 自動連携セットアップ（初心者向け）

Astro サイト（`https://insbs.net`）の URL を、Search Console API / Indexing API で一括管理する手順です。

## 重要な前提（よくある誤解）

| やりたいこと | API でできること |
|-------------|------------------|
| 各ブログ URL を「プロパティ」として数百件登録 | **通常は不要**（`https://insbs.net/` 1 プロパティで全 URL をカバー） |
| プロパティ（URL プレフィックス）の追加・削除 | `sites.add` / `sites.delete` |
| サイトマップ送信 | `sitemaps.submit` |
| 個別 URL のクロール依頼 | **Indexing API**（`urlNotifications.publish`） |

**所有権の確認**（DNS / HTML ファイル等）は、Search Console 上で初回のみ必要です。API は「登録」はできても、未確認プロパティはデータ取得できません。

---

## ステップ 1: Google Cloud で API を有効化

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. プロジェクトを作成（例: `ins-gsc-sync`）
3. **API とサービス** → **ライブラリ** で次を有効化:
   - **Google Search Console API**
   - **Web Search Indexing API**
4. **API とサービス** → **認証情報** → **認証情報を作成** → **サービスアカウント**
5. サービスアカウント作成後 → **キー** タブ → **鍵を追加** → **JSON** をダウンロード
6. ダウンロードした JSON をプロジェクト内に配置（例）:
   ```
   secrets/gsc-service-account.json
   ```
   ※ このファイルは **Git にコミットしない**（`.gitignore` 済み）

---

## ステップ 2: Search Console にサービスアカウントを追加

1. [Google Search Console](https://search.google.com/search-console) を開く
2. プロパティ `https://insbs.net/` を選択（なければ手動で追加し、DNS 等で確認）
3. **設定** → **ユーザーと権限** → **ユーザーを追加**
4. JSON 内の `client_email`（`xxxx@xxxx.iam.gserviceaccount.com`）を貼り付け
5. 権限は **所有者** を選択（Indexing API に必須）

---

## ステップ 3: 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集:

```env
GOOGLE_APPLICATION_CREDENTIALS=./secrets/gsc-service-account.json
```

---

## ステップ 4: パッケージ（すでに package.json に追加済み）

```bash
npm install
```

---

## ステップ 5: 設定ファイル

| ファイル | 役割 |
|---------|------|
| `gsc.config.json` | 本番 URL・プロパティ・サイトマップ・Indexing 上限 |
| `gsc/properties-register.json` | 追加登録するプロパティ（任意） |
| `gsc/properties-delete.json` | 削除するプロパティ |
| `gsc/urls-to-remove.txt` | インデックス削除通知する URL（1 行 1 URL） |

---

## コマンド一覧

```bash
# ヘルプ
npm run gsc -- help

# 登録済みプロパティ一覧
npm run gsc -- list-sites

# プロパティ一括登録
npm run gsc -- register-props

# プロパティ一括削除（gsc/properties-delete.json）
npm run gsc -- delete-props

# サイトマップ送信
npm run gsc -- submit-sitemap

# サイトマップ内 URL を Indexing API で登録（要 build 後の dist）
npm run build
npm run gsc -- index

# 本番サイトマップから URL 取得（ビルド不要）
npm run gsc -- index --remote

# 削除した URL へ URL_DELETED 通知
npm run gsc -- deindex

# まとめて実行（登録 + サイトマップ + インデックス）
npm run gsc:sync
# 別名（ご要望の sachi:sync）
npm run sachi:sync
```

### ドライラン（API を叩かない確認）

```bash
npm run gsc -- sync --dry-run
```

---

## Astro ビルドとの連携

### 方法 A: 独立コマンド（推奨）

デプロイ後に手動または CI で:

```bash
npm run gsc:sync
```

### 方法 B: ビルド直後に自動実行

`package.json` の `gsc:sync` が `build` の後に GSC 同期を実行します。  
CI（GitHub Actions）では **シークレット** に `GOOGLE_APPLICATION_CREDENTIALS` の JSON 内容を登録し、ファイルを復元してから `npm run gsc -- sync` を実行してください。

### サイトマップ

`@astrojs/sitemap` により `npm run build` で `dist/sitemap-index.xml` 等が生成されます。  
本番では `https://insbs.net/sitemap-index.xml` として公開されます。

---

## エラー時のチェックリスト

| 症状 | 対処 |
|------|------|
| 403 Forbidden | サービスアカウントが Search Console **所有者** か確認 |
| 401 Unauthorized | `.env` の JSON パス・鍵の有効性を確認 |
| 429 Too Many Requests | `gsc.config.json` の `delayMs` を増やす / 翌日再実行 |
| 404 on sites.add | プロパティ URL の末尾 `/` を確認 |
| Indexing が一部だけ成功 | `dailyLimit`（既定 180）を超えた分は翌日 |

---

## 参考リンク

- [Search Console API](https://developers.google.com/webmaster-tools/v1)
- [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/using-api)
- [sites.add](https://developers.google.com/webmaster-tools/v1/sites/add)
- [sitemaps.submit](https://developers.google.com/webmaster-tools/v1/sitemaps/submit)
