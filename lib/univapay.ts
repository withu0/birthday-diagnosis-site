import SDK from "univapay-node"

// UnivaPay SDKのインスタンスを作成
// secret、store id、tokenのみで初期化
export function getUnivaPaySDK() {
  const apiEndpoint = process.env.UNIVAPAY_API_URL || "https://api.univapay.com"
  
  // 環境変数から認証情報を取得
  // token = JWTトークン、secret = シークレット
  const token = process.env.UNIVAPAY_TOKEN
  const secret = process.env.UNIVAPAY_SECRET

  if (!token || !secret) {
    throw new Error(
      "UnivaPay credentials are not configured. Please set UNIVAPAY_TOKEN and UNIVAPAY_SECRET environment variables.\n\n" +
      "Required environment variables:\n" +
      "- UNIVAPAY_TOKEN: Your UnivaPay JWT token (App Token)\n" +
      "- UNIVAPAY_SECRET: Your UnivaPay secret (App Secret)\n\n" +
      "Optional environment variables:\n" +
      "- UNIVAPAY_API_URL: API endpoint (defaults to https://api.univapay.com)"
    )
  }

  return new SDK({
    endpoint: apiEndpoint,
    jwt: token,
    secret: secret,
  })
}

