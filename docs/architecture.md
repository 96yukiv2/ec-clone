# アーキテクチャ

## 採用技術
Next.js・React・TypeScript、NestJS、PostgreSQL、Drizzle、Redis、BullMQ、Mailpit、Docker Compose。

## モジュラーモノリスと依存方向

- Controller：HTTPのルーティング、パラメーター受け取り、レスポンス
- Service：ユースケース、認証確認、業務ルール、状態遷移、整合性
- Repository：SQL、トランザクション、DBとのやり取り
- Common：DB接続、Redisキャッシュ、入力検証、セキュリティ
- Worker：Outbox取得、BullMQジョブ、メール送信

\`\`\`mermaid
flowchart LR
  UI[Next.js] --> CT[Controller]
  CT --> S[Service]
  S --> R[Repository]
  R --> PG[(PostgreSQL)]
  S --> Cache[Redis Cache]
  Worker --> PG
  Worker --> Mail[Mailpit]
\`\`\`

## バックエンドのディレクトリ構成

\`\`\`text
apps/api/src/
├── app.ts
├── main.ts
├── common/
│   ├── db.ts
│   ├── cache.ts
│   ├── schema.ts
│   ├── security.ts
│   └── validation.ts
├── modules/
│   ├── auth/
│   │   ├── auth.ts
│   │   └── auth.repository.ts
│   ├── catalog/
│   │   ├── products.ts
│   │   ├── products.service.ts
│   │   ├── catalog.repository.ts
│   │   ├── discovery.ts
│   │   ├── discovery.service.ts
│   │   └── discovery.repository.ts
│   ├── checkout/
│   │   ├── orders.ts
│   │   ├── orders.service.ts
│   │   ├── orders.repository.ts
│   │   ├── guest.ts
│   │   ├── guest.service.ts
│   │   └── guest.repository.ts
│   ├── customer/
│   │   ├── customer.ts
│   │   ├── customer.service.ts
│   │   └── customer.repository.ts
│   └── admin/
│       ├── admin.ts
│       ├── admin.service.ts
│       ├── admin.repository.ts
│       ├── media.ts
│       └── jobs.ts
├── tests/
│   ├── app.integration.test.ts
│   ├── checkout.integration.test.ts
│   └── guest.integration.test.ts
└── worker/
    └── worker.ts
\`\`\`

NestJSのDIにより、Controller → Service → Repositoryの責務境界を商品・認証・注文・ゲスト購入・顧客・管理・推薦・ジョブ管理へ導入しました。メディアのファイルシステム保存やWorkerは別のインフラ処理です。全経路の動作はCI実行結果で確認する必要があります。

## フロントエンド

\`\`\`text
apps/web/src/
├── app/           App Routerの画面とルート
├── components/    再利用可能なUIと商品表示
└── lib/           APIクライアント・金額表示・ゲストカート
\`\`\`

### 依存のルール

- 認可の最終判定はAPIで行う
- SQLをReactコンポーネントに書かない
- 注文金額・税・在庫の確定は必ずサーバー側
- 価格は購入時点で注文明細にスナップショット保存する
- DB更新と外部メール処理は同じトランザクションに混ぜずOutboxを使う
