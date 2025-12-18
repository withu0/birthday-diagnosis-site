# Payment Success Flow - What Happens After UnivaPay Modal Succeeds

## Overview

This document explains the complete flow of what happens after a user successfully completes payment in the UnivaPay EC form modal.

## Flow Diagram

```
User completes payment in UnivaPay modal
         ↓
onTokenCreated callback triggered
         ↓
Frontend sends token to /api/payment/checkout/charge
         ↓
Backend creates charge with UnivaPay
         ↓
    ┌────┴────┐
    │         │
No 3DS   3DS Required
    │         │
    ↓         ↓
Immediate   Redirect to
Success     UnivaPay 3DS
    │         │
    │         ↓
    │    User completes 3DS
    │         │
    │         ↓
    │    Redirect back to /payment/return
    │         │
    └────┬────┘
         ↓
Payment Status Updated
         ↓
Membership Created
         ↓
Email Sent (with credentials)
         ↓
User Redirected to /payment/success
```

## Detailed Step-by-Step Flow

### Step 1: User Completes Payment in Modal

When the user enters their card details and clicks "Pay" in the UnivaPay modal:
- UnivaPay validates the card
- A transaction token is created
- The `onTokenCreated` callback is triggered

### Step 2: Token Created Callback (`onTokenCreated`)

**Location:** `app/payment/page.tsx` (line 109)

```javascript
onTokenCreated: async (token) => {
  // Extract token ID (handles both string and object formats)
  const tokenId = extractTokenId(token)
  
  // Send token to backend
  const response = await fetch("/api/payment/checkout/charge", {
    method: "POST",
    body: JSON.stringify({
      paymentId,
      transaction_token_id: tokenId,
      amount: totalAmount,
      redirect_endpoint: RETURN_URL
    })
  })
}
```

### Step 3: Backend Creates Charge

**Location:** `app/api/payment/checkout/charge/route.ts`

The backend:
1. Validates the request
2. Fetches the payment record from database
3. Creates a charge using UnivaPay SDK:
   ```javascript
   const charge = await sdk.charges.create({
     transactionTokenId: tokenId,
     amount: totalAmount,
     currency: "JPY",
     capture: true,
     metadata: { payment_id, plan_type, customer_name, customer_email }
   })
   ```

### Step 4: Two Possible Scenarios

#### Scenario A: Immediate Success (No 3DS Required)

**What happens:**
1. UnivaPay processes payment immediately
2. Charge status is `successful` or `completed`
3. Backend updates payment status to `completed`
4. Backend creates membership immediately (if not exists):
   - Creates or finds user account
   - Generates membership username and password
   - Sets 6-month expiration date
   - Sends email with credentials
5. Frontend receives success response
6. Frontend redirects to `/payment/success?paymentId=...`

**Code location:** `app/api/payment/checkout/charge/route.ts` (lines 98-154)

#### Scenario B: 3DS Authentication Required

**What happens:**
1. UnivaPay requires 3D Secure authentication
2. Backend receives redirect endpoint from UnivaPay
3. Frontend redirects user to UnivaPay 3DS page:
   ```javascript
   if (redirectInfo?.endpoint) {
     window.location.href = redirectInfo.endpoint
   }
   ```
4. User completes 3DS authentication on UnivaPay's page
5. User is redirected back to `/payment/return?univapayChargeId=...&status=...&paymentId=...`
6. Return page polls payment status
7. Webhook updates payment status when 3DS completes
8. Membership is created via webhook handler
9. User is redirected to success/cancel page based on final status

**Code location:** 
- Redirect: `app/payment/page.tsx` (line 149)
- Return page: `app/payment/return/page.tsx`
- Webhook: `app/api/payment/callback/route.ts`

### Step 5: Membership Creation

**Location:** `app/api/payment/callback/route.ts` (function `createMembership`)

When payment status becomes `completed`, the system:

1. **Checks for existing user:**
   - Searches by email address
   - If exists, uses existing user
   - If not, creates new user with generated password

2. **Creates membership:**
   - Generates unique username: `user_xxxxx`
   - Generates secure password: random hex string
   - Sets access expiration: 6 months from now
   - Sets `isActive: true`
   - Records `accessGrantedAt` timestamp

3. **Sends email:**
   - Email contains:
     - Username
     - Password
     - Member site URL
     - Expiration notice (6 months)
   - Email is logged to console in development
   - Email is sent via configured service in production

### Step 6: Success Page Display

**Location:** `app/payment/success/page.tsx`

The success page:
1. Verifies payment status via `/api/payment/verify`
2. Displays success message
3. Shows credentials if available (for bank transfer or immediate credit card success)
4. Shows message about email delivery for other cases
5. Provides buttons to:
   - Go to login page
   - Return to top page

### Step 7: Webhook Updates (Asynchronous)

**Location:** `app/api/payment/callback/route.ts` (POST handler)

UnivaPay sends webhook events to update payment status:
- Event types: `charge.finished`, `charge.succeeded`, etc.
- Webhook handler:
  1. Verifies authentication (if `UNIVAPAY_WEBHOOK_AUTH` is set)
  2. Extracts charge ID and status from webhook payload
  3. Finds payment by `univapayTransactionId`
  4. Updates payment status
  5. Creates membership if status becomes `completed` and membership doesn't exist

## Key Database Updates

### Payment Record
- `status`: Updated to `completed`, `failed`, or `cancelled`
- `univapayOrderId`: UnivaPay charge ID
- `univapayTransactionId`: UnivaPay transaction ID
- `updatedAt`: Timestamp of last update

### Membership Record (Created when payment completes)
- `userId`: Links to user account
- `paymentId`: Links to payment record
- `username`: Generated membership username
- `passwordHash`: Hashed membership password
- `accessExpiresAt`: 6 months from creation
- `isActive`: `true`
- `accessGrantedAt`: Timestamp
- `credentialsSentAt`: Timestamp when email was sent

### User Record (Created if doesn't exist)
- `email`: Customer email
- `name`: Customer name
- `passwordHash`: Hashed password for login

## Email Content

The email sent to the customer contains:

```
12SKINS会員サイトへのアクセス情報

[Customer Name]様

お支払いありがとうございます。
会員サイトへのアクセス情報をお送りいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【会員サイトアクセス情報】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ユーザーID: [username]
パスワード: [password]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

会員サイトURL: [BASE_URL]/member

※この認証情報は6ヶ月間有効です。
※このメールは自動送信されています。返信はできません。
```

## Error Handling

### If Charge Creation Fails
- Payment status set to `failed`
- User redirected to `/payment/cancel?paymentId=...`
- Error message displayed

### If 3DS Fails
- User redirected back with `status=failed`
- Payment status updated to `failed`
- User redirected to cancel page

### If Webhook Fails
- Payment status may remain `pending`
- Return page polls status as fallback
- Manual verification possible via `/api/payment/verify`

## Important Notes

1. **Membership is created in two places:**
   - Immediately after charge creation (if no 3DS)
   - Via webhook handler (if 3DS was required)

2. **Email is sent only once:**
   - When membership is created
   - `credentialsSentAt` timestamp prevents duplicate emails

3. **Credentials are shown on success page only for:**
   - Bank transfer payments (immediate completion)
   - Credit card payments that complete immediately (no 3DS)

4. **For 3DS payments:**
   - Credentials are sent via email only
   - Success page shows message about email delivery

5. **Webhook is recommended but not required:**
   - System works with polling as fallback
   - Webhook provides faster status updates

