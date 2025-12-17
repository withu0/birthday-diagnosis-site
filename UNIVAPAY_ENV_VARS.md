# UnivaPay 環境変数一覧

このドキュメントには、UnivaPay統合に必要な環境変数のみが記載されています。

## 必須環境変数

### バックエンド（サーバー側）

```env
# UnivaPay API認証情報
UNIVAPAY_TOKEN=your_univapay_jwt_token    # アプリトークン（JWT）
UNIVAPAY_SECRET=your_univapay_secret      # アプリシークレット
```

**取得方法:**
1. UnivaPayダッシュボードにログイン
2. `店舗` > 店舗を選択 > `開発` > `アプリトークン` ページに移動
3. `追加` をクリックしてアプリトークンを作成
4. 作成されたJWTトークンをコピー → `UNIVAPAY_TOKEN`に設定
5. シークレットを保存 → `UNIVAPAY_SECRET`に設定

### フロントエンド（クライアント側）

```env
# UnivaPayウィジェット設定
NEXT_PUBLIC_UNIVAPAY_APP_ID=your_univapay_jwt_token  # UNIVAPAY_TOKENと同じJWTトークン
```

**注意:** `NEXT_PUBLIC_UNIVAPAY_APP_ID`には`UNIVAPAY_TOKEN`と同じJWTトークンを設定します。

## オプション環境変数

```env
# UnivaPay APIエンドポイント（通常は変更不要）
UNIVAPAY_API_URL=https://api.univapay.com

# 3DSリダイレクト後のURL（自動設定されるため通常は不要）
NEXT_PUBLIC_UNIVAPAY_RETURN_URL=http://localhost:3000/payment/return

# Webhook認証（セキュリティ強化のため推奨）
UNIVAPAY_WEBHOOK_AUTH=your_webhook_auth_secret
```

## 削除された環境変数（不要）

以下の環境変数は**使用されていません**。削除してください：

- ❌ `UNIVAPAY_STORE_ID` - JWTトークンに含まれているため不要
- ❌ `UNIVAPAY_STORE_JWT` - `UNIVAPAY_TOKEN`を使用
- ❌ `UNIVAPAY_STORE_JWT_SECRET` - `UNIVAPAY_SECRET`を使用
- ❌ `UNIVAPAY_FORM_ID` - 旧ECFormLink方式で使用（現在はウィジェット方式を使用）

## 設定例

### 開発環境（.env.local）

```env
# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# UnivaPay（必須）
UNIVAPAY_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
UNIVAPAY_SECRET=your_secret_here
NEXT_PUBLIC_UNIVAPAY_APP_ID=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# UnivaPay（オプション）
UNIVAPAY_WEBHOOK_AUTH=your_webhook_secret_here

# アプリケーションURL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 確認方法

環境変数が正しく設定されているか確認するには：

1. **バックエンド認証:** `/api/payment/create`エンドポイントを呼び出してエラーが出ないか確認
2. **フロントエンドウィジェット:** 決済ページでUnivaPayウィジェットが表示されるか確認
3. **Webhook:** UnivaPayダッシュボードでWebhook URLを設定し、`UNIVAPAY_WEBHOOK_AUTH`が正しく動作するか確認

## トラブルシューティング

### エラー: "UnivaPay credentials are not configured"

→ `UNIVAPAY_TOKEN`と`UNIVAPAY_SECRET`が設定されているか確認してください。

### エラー: "UnivaPay設定が不完全です。NEXT_PUBLIC_UNIVAPAY_APP_IDを設定してください。"

→ `NEXT_PUBLIC_UNIVAPAY_APP_ID`が設定されているか確認してください。`UNIVAPAY_TOKEN`と同じ値を設定します。

### ウィジェットが表示されない

→ `NEXT_PUBLIC_UNIVAPAY_APP_ID`が正しく設定されているか、ブラウザのコンソールでエラーを確認してください。

