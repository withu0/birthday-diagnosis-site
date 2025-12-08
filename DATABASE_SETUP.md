# Database Setup Guide

このプロジェクトでは、Drizzle ORM と PostgreSQL を使用しています。

## 必要な環境変数

`.env.local` ファイルに以下の環境変数を追加してください：

```env
# PostgreSQL Database URL
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Session Secret (本番環境では必ず変更してください)
SESSION_SECRET=your-secret-key-change-this-in-production
```

## データベースのセットアップ

### 1. PostgreSQL のインストール

PostgreSQL がインストールされていない場合は、以下のいずれかの方法でインストールしてください：

- **macOS**: `brew install postgresql`
- **Windows**: [PostgreSQL 公式サイト](https://www.postgresql.org/download/windows/)からダウンロード
- **Linux**: `sudo apt-get install postgresql` (Ubuntu/Debian)

### 2. データベースの作成

PostgreSQL に接続してデータベースを作成します：

```bash
# PostgreSQL に接続
psql -U postgres

# データベースを作成
CREATE DATABASE birthday_diagnosis;

# 接続を終了
\q
```

### 3. マイグレーションの実行

データベーススキーマを適用します：

```bash
# マイグレーションファイルを生成
npm run db:generate

# データベースにスキーマを適用
npm run db:push
```

または、マイグレーションファイルを使用する場合：

```bash
npm run db:migrate
```

### 4. データベースの確認

Drizzle Studio を使用してデータベースを確認できます：

```bash
npm run db:studio
```

ブラウザで `http://localhost:4983` が開き、データベースの内容を確認できます。

## トラブルシューティング

### 接続エラーが発生する場合

1. PostgreSQL が起動しているか確認してください：
   ```bash
   # macOS/Linux
   pg_isready
   
   # Windows (サービスが起動しているか確認)
   ```

2. `DATABASE_URL` の形式が正しいか確認してください：
   ```
   postgresql://username:password@host:port/database_name
   ```

3. データベースが存在するか確認してください：
   ```bash
   psql -U postgres -l
   ```

### マイグレーションエラーが発生する場合

- 既存のテーブルがある場合は、`db:push` を使用すると自動的にスキーマが更新されます
- 問題が解決しない場合は、データベースを再作成してから再度マイグレーションを実行してください
