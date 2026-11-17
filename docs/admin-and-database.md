# 管理画面とPostgreSQLの見方

## 管理画面

管理画面は http://localhost:3000/admin です。通常のユーザーには表示されず、管理者アカウントでログインするとヘッダーに「管理画面」が表示されます。

1. http://localhost:3000/account から会員登録します。
2. 登録したメールアドレス（下記コマンド中のメール）を使って、自分のアカウントを管理者にします。
3. アカウントページを再読み込みするか、ログアウトしてログインし直します。
4. 管理画面を開きます。

```sh
docker compose exec postgres psql -U ec -d ec -c "UPDATE users SET role='admin' WHERE email='your-local-email@example.test';"
```

管理画面では商品登録・在庫/価格更新、受注一覧、発送・配達完了、売上、在庫不足、人気商品を確認できます。管理APIの監査ログは `GET /admin/audit` にあります。

## CursorでDBを見る（おすすめ）

**PostgreSQL（Microsoft製、拡張ID: `ms-ossdata.vscode-pgsql`）** はCursorに対応しています。Cursorの拡張機能から「PostgreSQL」で検索してインストールしてください。

接続先は `compose.yaml` のPostgreSQLポート公開設定に対応します。

| 設定 | 値 |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `ec` |
| Username | `ec` |
| Password | `ec` |
| SSL | 無効（ローカル） |

接続後は `public` スキーマ内の `products` / `users` / `orders` / `order_items` / `carts` / `reviews` を閲覧できます。

SQL例：

```sql
SELECT id, name, price, stock FROM products ORDER BY id LIMIT 20;
SELECT id, status, total, created_at FROM orders ORDER BY created_at DESC LIMIT 20;
SELECT order_id, product_name, quantity, unit_price FROM order_items ORDER BY order_id DESC LIMIT 20;
```

注意: `users` にはパスワードハッシュやメールアドレスが含まれます。接続情報や実データは公開しないでください。

## DBeaver Communityを使う場合

Cursor内ではなく専用GUIでデータを見たい場合、無料・オープンソースのDBeaver Communityも利用できます。接続設定は同じです。

- https://learn.microsoft.com/ja-jp/azure/postgresql/development/vs-code-extension/postgresql-extension-overview
- https://dbeaver.io/download/
