# EC Clone — ECサイト開発学習プロジェクト

Next.jsとNestJSでAmazonのようなECサイトの基本的な仕組みを作り、フロントエンド、バックエンド、データベース、決済、非同期処理、テストを学ぶための**ローカル専用**プロジェクトです。Amazonとは無関係です。

## 開発方針

- GitHubの `main` ブランチに直接反映し、PRを前提としません。
- Next.js + React + TypeScript、NestJSのモジュラーモノリス、PostgreSQL、Redisを利用します。
- 決済はMockです。Stripeテスト環境への接続は後から追加します。
- 各サービスはDocker Composeで起動します。
- 仕様・アーキテクチャ・実装状況は日本語の [docs](docs/README.md) に整理します。
- 単体テスト・結合テスト・CIを利用します。

## 起動方法

Docker Desktopが起動している状態で、以下を実行してください。

```bash
git clone https://github.com/96yukiv2/ec-clone.git
cd ec-clone
docker compose up --build
```

| 用途 | URL |
|---|---|
| 商品サイト | http://localhost:3000 |
| REST API | http://localhost:4000 |
| Swagger | http://localhost:4000/docs |
| テストメール | http://localhost:8025 |

初期商品150件、割引クーポン `WELCOME10` を用意しています。

## 管理者登録

まず `/account` からアカウントを登録し、**自分のローカルアカウントだけ**管理者に変更します。

```bash
docker compose exec postgres psql -U ec -d ec -c "UPDATE users SET role='admin' WHERE email='your-local-email@example.test';"
```

例のアドレスを実際の登録アドレスに変更してください。

## ドキュメント

- [機能一覧・実装状況](docs/features.md)
- [アーキテクチャ](docs/architecture.md)
- [DB・注文処理](docs/data-and-orders.md)
- [開発・テスト・CI](docs/development.md)

## 検証上の注意

**すべての要求機能の動作完了を保証する状態ではありません。** GitHubへのコード反映と、実際のビルド・単体テスト・結合テスト・E2Eテスト完了は別です。未完成機能は上記の一覧で明示しています。現状、Docker実行・CI完走はこの作業環境から確認できていません。

公開・商用利用を想定していません。実在する顧客の個人情報や決済情報は登録しないでください。
