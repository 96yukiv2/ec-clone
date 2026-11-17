# 開発・テスト・CI

## ローカル起動

Docker DesktopとDocker Composeをインストールし、リポジトリ直下で実行します。

```bash
docker compose up --build
```

| サービス | URL |
|---|---|
| ECサイト | http://localhost:3000 |
| API | http://localhost:4000 |
| OpenAPI画面 | http://localhost:4000/docs |
| Mailpit | http://localhost:8025 |

初回起動ではDrizzleスキーマ反映と150件のダミー商品作成を実行します。テスト用クーポンは `WELCOME10` です。

## テスト

```bash
corepack enable
pnpm install
pnpm --filter @ec/api test
pnpm --filter @ec/api build
pnpm --filter @ec/web build
```

結合テストは `DATABASE_URL` に**専用テストDB**を指定して実行してください。本番・開発DBをテスト用に流用しないでください。

```bash
DATABASE_URL=postgres://ec:ec@localhost:5433/ec_test pnpm --filter @ec/api test:integration
```

CIではPostgreSQL/Redisをサービスとして起動し、スキーマ反映、型検査、単体・結合テストを実行します。CI設定は `.github/workflows/ci.yml` です。

## 現時点の検証状況

リポジトリへのコード反映は実施しましたが、こちらの実行環境ではGitHubからのネットワーククローンとDocker起動を行えません。従って、**実際のDocker起動・ビルド・全テストの合格は未確認**です。CIが初回実行後に合格するまでは「動作確認済み」と判断しないでください。
