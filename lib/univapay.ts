import SDK from "univapay-node"

// UnivaPay SDKのインスタンスを作成
export function getUnivaPaySDK() {
  const apiEndpoint = process.env.UNIVAPAY_API_URL || "https://api.univapay.com"
  const storeJwt = process.env.UNIVAPAY_STORE_JWT
  const storeJwtSecret = process.env.UNIVAPAY_STORE_JWT_SECRET

  if (!storeJwt || !storeJwtSecret) {
    throw new Error("UnivaPay credentials are not configured. Please set UNIVAPAY_STORE_JWT and UNIVAPAY_STORE_JWT_SECRET environment variables.")
  }

  return new SDK({
    endpoint: apiEndpoint,
    jwt: storeJwt,
    secret: storeJwtSecret,
  })
}

