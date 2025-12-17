# UnivaPay決済システム セットアップガイド

## 概要

このプロジェクトでは、UnivaPayを使用した決済システムを実装しています。
以下の機能が含まれています：

- 3つのプラン選択（50,000円、80,000円、100,000円、税別）
- UnivaPayとの決済連携
- 決済完了後の自動ID/パスワード生成とメール送信
- 6ヶ月後の閲覧権限自動削除

## セットアップ手順

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# UnivaPay API設定
# 公式SDKを使用するため、JWTとシークレットが必要です
# Store IDはJWTトークンに含まれているため、別途指定する必要はありません
# 設定方法: 店舗 > 店舗を選択 > 開発 > アプリトークン ページで作成
UNIVAPAY_API_URL=https://api.univapay.com
UNIVAPAY_STORE_JWT=your_store_jwt_token
UNIVAPAY_STORE_JWT_SECRET=your_store_jwt_secret

# アプリケーションURL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cron Job認証（オプション）
CRON_SECRET=your_cron_secret_key

# メール送信設定（オプション）
EMAIL_SERVICE=console  # "console", "sendgrid", "ses", etc.
# SendGridを使用する場合
# SENDGRID_API_KEY=your_sendgrid_api_key
# AWS SESを使用する場合
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 2. データベースマイグレーション

データベーススキーマを適用します：

```bash
npm run db:push
# または
npm run db:migrate
```

### 3. UnivaPayアカウントの設定

1. [UnivaPay](https://www.univapay.com/)でアカウントを作成
2. ストアJWTトークンとシークレットを取得：
   - `店舗` > 店舗を選択 > `開発` > `アプリトークン` ページに移動
   - `追加` をクリック
   - ドメインとモードを追加する
   - 作成されたトークンから JWT をコピーする
   - シークレットを保存する
3. 環境変数に設定：
   - `UNIVAPAY_STORE_JWT`: コピーしたJWTトークン
   - `UNIVAPAY_STORE_JWT_SECRET`: 保存したシークレット

**注意**: Store IDはJWTトークンに含まれているため、別途指定する必要はありません。SDKが自動的にJWTからStore IDを認識します。

詳細は[公式ドキュメント](https://docs.univapay.com/docs/api/)を参照してください。

### 4. メール送信の設定（オプション）

デフォルトでは、メールはコンソールに出力されます。
本番環境では、以下のいずれかのメールサービスを設定してください：

#### SendGridを使用する場合

1. SendGridアカウントを作成
2. APIキーを取得
3. `EMAIL_SERVICE=sendgrid`と`SENDGRID_API_KEY`を設定
4. `app/api/payment/callback/route.ts`のメール送信部分を実装

#### AWS SESを使用する場合

1. AWSアカウントでSESを設定
2. アクセスキーとシークレットキーを取得
3. `EMAIL_SERVICE=ses`とAWS認証情報を設定
4. `app/api/payment/callback/route.ts`のメール送信部分を実装

### 5. 会員権限の有効期限チェック

会員権限の有効期限チェックは、ユーザーがログインする際に自動的に行われます。
有効期限が切れている場合は、自動的にアクセス権限が削除されます。

- ログイン時: `/api/auth/login`で有効期限をチェック
- セッション確認時: `/api/auth/me`で有効期限をチェック

追加の設定は不要です。

## 使用方法

### 支払いフォームへのアクセス

```
http://localhost:3000/payment
```

### 決済フロー

1. ユーザーが支払いフォームで情報を入力
2. プランを選択（50,000円、80,000円、100,000円）
3. 支払い方法を選択（銀行振込、クレジットカード、口座引き落とし）
4. UnivaPay決済ページへリダイレクト
5. 決済完了後、コールバックで処理
6. 自動的にID/パスワードを生成し、メール送信
7. 6ヶ月後に自動的に閲覧権限を削除

## APIエンドポイント

### 支払い作成

```
POST /api/payment/create
Content-Type: application/json

{
  "planType": "basic" | "standard" | "premium",
  "paymentMethod": "bank_transfer" | "credit_card" | "direct_debit",
  "name": "山田太郎",
  "email": "example@example.com",
  "phoneNumber": "09012345678",
  "postalCode": "1234567",
  "address": "東京都...",
  "gender": "male" | "female",
  "birthYear": "2000",
  "birthMonth": "12",
  "birthDay": "31",
  "companyName": "株式会社..." (オプション)
}
```

### 決済コールバック

```
POST /api/payment/callback
GET /api/payment/callback?payment_id=...&order_id=...&status=...
```

### 決済確認

```
GET /api/payment/verify?paymentId=...
```

### 会員権限の有効期限チェック

会員権限の有効期限チェックは、ユーザーがログインする際に自動的に行われます。
有効期限が切れている場合は、自動的にアクセス権限が削除されます。

- ログイン時: `/api/auth/login`で有効期限をチェック
- セッション確認時: `/api/auth/me`で有効期限をチェック

## データベーススキーマ

### payments テーブル

支払い情報を保存します。

### memberships テーブル

会員権限情報を保存します。
- `accessExpiresAt`: 6ヶ月後の有効期限
- `isActive`: アクティブ状態

## トラブルシューティング

### UnivaPay連携が動作しない

1. JWTトークンとシークレットが正しく設定されているか確認
2. コールバックURLが正しく設定されているか確認
3. [UnivaPay APIドキュメント](https://docs.univapay.com/docs/api/)を確認し、API仕様に合わせて調整
4. SDKのエラーログを確認（コンソールに詳細が出力されます）

### メールが送信されない

1. 開発環境では、コンソールにメール内容が出力されます
2. 本番環境では、メールサービスの設定を確認
3. メール送信エラーをログで確認

### 会員権限が期限切れにならない

1. ユーザーがログインしていることを確認
2. ログイン時に有効期限チェックが実行されます
3. データベースの`memberships`テーブルで`accessExpiresAt`と`isActive`を確認

## 注意事項

- 公式SDK `univapay-node`を使用しています。最新バージョンに更新する場合は`npm update univapay-node`を実行してください
- UnivaPayのAPI仕様は変更される可能性があります。[最新のドキュメント](https://docs.univapay.com/docs/api/)を確認してください
- 本番環境では、必ずHTTPSを使用してください
- メール送信機能は、実際のメールサービスを使用するように実装してください
- セキュリティのため、環境変数は適切に管理してください
- JWTトークンとシークレットは機密情報です。Gitリポジトリにコミットしないでください

## 参考リンク

- [UnivaPay公式SDK (GitHub)](https://github.com/univapay/univapay-node)
- [UnivaPay APIドキュメント](https://docs.univapay.com/docs/api/)

