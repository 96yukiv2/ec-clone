# Docker Compose起動時のトラブルシューティング

## `dependency failed to start: container ec-clone-api-1 is unhealthy`

APIコンテナがDockerのヘルスチェックに応答できない状態を示します。これだけで根本原因は確定しません。

### 1. 最新コードへ更新

```bash
git pull origin main
docker compose down
docker compose up --build --force-recreate
```

`down --volumes` はPostgreSQLの保存データを削除するので、通常の復旧では実行しないでください。

### 2. APIログを確認

```bash
docker compose logs --tail=200 api
docker compose ps -a
```

依存解決エラー、DBスキーマ反映失敗、パッケージインストール失敗などがないか確認します。

### 3. ヘルスチェック状況

```bash
docker inspect ec-clone-api-1 --format '{{json .State.Health}}'
```

API起動後は次のURLにアクセスして確認できます。

- http://localhost:4000/health
- http://localhost:4000/products
- http://localhost:3000

`/health` はDB接続が成功すると `{"status":"ok","database":"ok"}` を返します。

## pnpmのキャッシュ

pnpmが生成した `.pnpm-store/` は再生成可能なキャッシュです。Git管理から除外しています。

既にGitで追跡している場合に限り、次のコマンドでGitの管理対象から外します（ローカルのファイルは残ります）。

```bash
git rm -r --cached .pnpm-store
```

追跡されていない場合は上記の操作は不要です。

## 起動エラーが解消しない場合

`docker compose logs --tail=200 api` の出力に加え、`docker compose ps -a` を確認します。パッケージのダウンロードや依存関係の初期化など、ヘルスチェックがタイムアウトする以前の原因を把握できます。
