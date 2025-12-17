# Payment Flow Documentation

## Overview

This document explains what happens at each step of the UnivaPay payment process, including success and failure scenarios.

## Payment Flow Scenarios

### Scenario 1: Payment Succeeds Immediately (No 3DS Required)

1. **User submits payment form** → Payment record created with status `pending`
2. **UnivaPay widget opens** → User enters card details
3. **Widget creates token** → `transaction_token_id` generated
4. **Frontend calls `/api/payment/checkout/charge`** → Token sent to backend
5. **Backend creates charge** → UnivaPay processes payment
6. **Charge succeeds immediately** → Status: `successful`
7. **Backend updates payment** → Status changed to `completed`
8. **Backend creates membership** → User account + membership credentials generated
9. **Email sent** → Credentials sent to user's email
10. **Frontend redirects** → `/payment/success?paymentId=...`
11. **Success page shows** → Credentials displayed (if available)

### Scenario 2: Payment Requires 3DS Authentication

1. **Steps 1-5 same as Scenario 1**
2. **3DS required** → UnivaPay returns redirect endpoint
3. **User redirected to UnivaPay** → 3DS authentication page
4. **User completes 3DS** → Authentication succeeds/fails
5. **User redirected back** → `/payment/return?univapayChargeId=...&status=...&paymentId=...`
6. **Return page checks status** → Polls payment status every 3 seconds
7. **Webhook updates payment** → Status changes to `completed`/`failed`
8. **Membership created** → When status becomes `completed` (via webhook)
9. **Return page redirects** → Based on final status:
   - `completed` → `/payment/success?paymentId=...`
   - `failed`/`cancelled` → `/payment/cancel?paymentId=...`

### Scenario 3: Payment Fails

#### Failure at Charge Creation

1. **Steps 1-4 same as Scenario 1**
2. **Charge creation fails** → UnivaPay returns error
3. **Backend updates payment** → Status: `failed`
4. **Frontend receives error** → Error message displayed
5. **Frontend redirects** → `/payment/cancel?paymentId=...`
6. **Cancel page shows** → "Payment cancelled" message

#### Failure at 3DS Authentication

1. **Steps 1-4 same as Scenario 2**
2. **3DS authentication fails** → User cancels or authentication fails
3. **User redirected back** → `/payment/return?status=failed&paymentId=...`
4. **Return page detects failure** → Status: `failed`
5. **Webhook updates payment** → Status: `failed` (if webhook received)
6. **Return page redirects** → `/payment/cancel?paymentId=...`
7. **Cancel page shows** → "Payment cancelled" message

## Status Flow

```
pending → (charge created) → pending/awaiting
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              successful            failed/cancelled
                    ↓                   ↓
              completed            failed/cancelled
```

## Key Endpoints

### `/api/payment/checkout/charge` (POST)
- **Purpose**: Create charge from widget token
- **On Success**: 
  - Updates payment status to `completed` (if immediate success)
  - Creates membership immediately (if no 3DS)
  - Returns redirect endpoint (if 3DS required)
- **On Failure**: 
  - Updates payment status to `failed`
  - Returns error message

### `/api/payment/callback` (POST - Webhook)
- **Purpose**: Receive webhook events from UnivaPay
- **On Charge Success**: 
  - Updates payment status to `completed`
  - Creates membership (if not exists)
  - Sends credentials email
- **On Charge Failure**: 
  - Updates payment status to `failed`/`cancelled`

### `/api/payment/callback` (GET - 3DS Return)
- **Purpose**: Handle 3DS redirect return
- **Action**: Redirects to `/payment/return` with query params

### `/api/payment/verify` (GET)
- **Purpose**: Check payment status
- **Returns**: 
  - Payment status
  - Whether membership exists
  - Membership username (if exists)

## Pages

### `/payment/return`
- **Purpose**: Handle 3DS redirect return
- **Actions**:
  - Checks payment status on load
  - Polls status every 3 seconds (up to 30 seconds)
  - Shows appropriate message based on status
  - Auto-redirects based on final status

### `/payment/success`
- **Purpose**: Show payment success
- **Actions**:
  - Verifies payment status
  - Shows credentials if membership exists
  - Shows "check email" message if credentials sent via email

### `/payment/cancel`
- **Purpose**: Show payment failure/cancellation
- **Actions**:
  - Shows cancellation message
  - Provides link to retry payment

## Membership Creation

Membership is created in two scenarios:

1. **Immediate Success** (no 3DS):
   - Created in `/api/payment/checkout/charge` when charge succeeds
   - Credentials logged to console (email service can be configured)

2. **After 3DS Success**:
   - Created in `/api/payment/callback` webhook handler
   - Triggered when webhook confirms payment completion
   - Credentials sent via email

## Error Handling

- **Widget errors**: Shown as alert, user stays on payment page
- **Charge creation errors**: Redirected to cancel page
- **3DS failures**: Detected on return page, redirected to cancel page
- **Webhook errors**: Logged, but webhook always returns 200 (to acknowledge receipt)

## Status Polling

The return page polls payment status to handle cases where:
- Webhook hasn't arrived yet
- Network delays
- 3DS completion but status not immediately updated

Polling stops after 30 seconds or when status becomes `completed`/`failed`/`cancelled`.

