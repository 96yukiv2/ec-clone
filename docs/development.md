# 開発・テスト・CI

## ローカルで起動

Docker Desktop・Docker Composeが必要です。

\`\`\`bash
docker compose up --build
\`\`\`

- ECサイト: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/docs
- Mailpit: http://localhost:8025

## CI（GitHub Actions）

ワークフロー: \`.github/workflows/ci.yml\`

### test ジョブ

- PostgreSQL 17とRedis 7をサービスとして起動
- DBスキーマ反映、全文検索用インデックス作成、シード投入
- Vitestでバックエンドのドメイン単体テストを実施
- Reactコンポーネントの単体テスト
- Supertest + PostgreSQLを用いたAPI結合テスト
- TypeScriptビルド（API、Web）
- Playwright Chromiumで商品閲覧・検索・購入の画面E2Eテスト

### docker-smoke ジョブ

- \`docker compose config -q\` で定義チェック
- \`docker compose up --detach --wait\` でサービス起動
- \`scripts/smoke.mjs\` によりWeb/商品API/登録/カート/注文/冪等性/Mock決済を確認
- 商品検索APIの軽量な並行負荷チェック（`scripts/load.mjs`）
- 失敗時のログ収集と、終了時のボリューム削除

## 手元でテストする場合

\`\`\`bash
corepack enable
pnpm install
pnpm --filter @ec/api test
pnpm --filter @ec/web test
pnpm --filter @ec/api build
pnpm --filter @ec/web build
\`\`\`

結合テストは専用DB（名前に \`ec_test\` を含むこと）だけを使います。開発環境のDBを結合テストに使わないでください。

\`\`\`bash
DATABASE_URL=postgres://ec:ec@localhost:5433/ec_test pnpm --filter @ec/api test:integration
\`\`\`

## 検証結果

ファイルとGitHubへのコミットは確認済みです。一方、編集用環境にDockerエンジンがなく、GitHubへのネットワーク接続も制限されるため、Docker起動やCI合格をこちらから確認できていません。CIでテストが成功して初めて「合格」に更新します。
