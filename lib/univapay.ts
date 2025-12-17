import SDK from "univapay-node"

// UnivaPay SDKのインスタンスを作成
// secret、store id、tokenのみで初期化
export function getUnivaPaySDK() {
  const apiEndpoint = process.env.UNIVAPAY_API_URL || "https://api.univapay.com"
  
  // 環境変数から認証情報を取得
  // token = JWTトークン、secret = シークレット、store id = ストアID（オプション）
  const token = process.env.UNIVAPAY_TOKEN || process.env.UNIVAPAY_STORE_JWT
  const secret = process.env.UNIVAPAY_SECRET || process.env.UNIVAPAY_STORE_JWT_SECRET
  const storeId = process.env.UNIVAPAY_STORE_ID

  if (!token || !secret) {
    throw new Error(
      "UnivaPay credentials are not configured. Please set UNIVAPAY_TOKEN and UNIVAPAY_SECRET environment variables.\n\n" +
      "Required environment variables:\n" +
      "- UNIVAPAY_TOKEN: Your UnivaPay JWT token\n" +
      "- UNIVAPAY_SECRET: Your UnivaPay secret\n" +
      "- UNIVAPAY_STORE_ID: Your store ID (optional, usually included in JWT)\n" +
      "- UNIVAPAY_API_URL: API endpoint (optional, defaults to https://api.univapay.com)"
    )
  }

  return new SDK({
    endpoint: apiEndpoint,
    jwt: token,
    secret: secret,
  })
}

