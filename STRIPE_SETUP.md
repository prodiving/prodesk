# Stripe Integration Setup

This guide walks through setting up Stripe payment processing for the equipment buy feature.

## What Was Added

1. **Backend Stripe Integration** (`server/index.js`)
   - `/api/stripe/payment-intent` - Creates a Stripe payment intent
   - `/api/stripe/confirm-payment` - Confirms payment and creates payment record in database

2. **Frontend Components**
   - `StripeCheckoutModal` - Modal with Stripe card element for checkout
   - `StripeProvider` - Context provider for Stripe Elements
   - Equipment page "Buy" button - Initiates checkout flow

3. **Dependencies Installed**
   - `@stripe/stripe-js` - Stripe JavaScript library
   - `@stripe/react-stripe-js` - React Stripe components
   - `stripe` - Stripe Node.js SDK (backend)

## Setup Instructions

### 1. Get Stripe API Keys

1. Create a [Stripe account](https://stripe.com) (if you don't have one)
2. Go to [API Keys Dashboard](https://dashboard.stripe.com/apikeys)
3. Copy your keys:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

### 2. Set Environment Variables

#### For Amplify (Frontend):
1. Go to AWS Amplify Console → Your App → App settings → **Environment variables**
2. Add a new variable:
   - **Name**: `VITE_STRIPE_PUBLIC_KEY`
   - **Value**: Your Stripe publishable key (e.g., `pk_live_...`)
3. Save and redeploy

#### For Railway (Backend):
1. Go to Railway Dashboard → Your Project → Variables
2. Add a new variable:
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: Your Stripe secret key (e.g., `sk_live_...`)
3. Deploy will auto-trigger

### 3. Verify Stripe Keys Locally

For local testing, create a `.env.local` file in the project root:

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_... # Your test publishable key
```

And in `server/` directory `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_... # Your test secret key
```

### 4. Test Stripe Payments Locally

1. Start the backend:
   ```bash
   cd server && PORT=3001 node index.js
   ```

2. Start the frontend (in another terminal):
   ```bash
   npm run dev
   ```

3. Navigate to Equipment page and click the "Buy" button on any item

4. Use Stripe's test card numbers:
   - **Successful** payment: `4242 4242 4242 4242`
   - **Failed** payment: `4000 0000 0000 0002`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)

### 5. Payment Flow

When a user clicks "Buy":

1. A **transaction** record is created in the database
2. The checkout modal opens with Stripe's card element
3. User enters card details and clicks "Pay"
4. Frontend calls `/api/stripe/payment-intent` to create a Stripe payment intent
5. Stripe card payment is confirmed on the frontend
6. Upon success, backend `/api/stripe/confirm-payment` records the payment
7. Equipment stock is decremented (optional)
8. User sees success toast

### 6. View Payments in Dashboard

- **Local/Test**: Dashboard at [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
- **Production**: Switch to Live keys and view at [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)

## Database Schema

The integration uses the existing `payments` table:

```sql
CREATE TABLE payments (
  id VARCHAR PRIMARY KEY,
  transaction_id VARCHAR,
  amount DECIMAL,
  payment_method VARCHAR,
  reference_number VARCHAR,      -- Stripe payment intent ID
  payment_status VARCHAR,         -- 'completed', 'pending', etc.
  notes VARCHAR,
  created_at TIMESTAMP
);
```

## Troubleshooting

### "Stripe not loaded" error
- Ensure `VITE_STRIPE_PUBLIC_KEY` is set in Amplify environment variables
- Rebuild and redeploy

### Payment fails with "Permission denied"
- Check that `STRIPE_SECRET_KEY` is set in Railway environment
- Verify key format (should start with `sk_test_` or `sk_live_`)

### "Payment intent not found"
- Ensure backend can reach Stripe API (check internet connectivity)
- Verify secret key is correct and active

## Next Steps

- **Webhooks**: Set up Stripe webhooks for real-time payment updates
- **Refunds**: Implement refund functionality in the payment record UI
- **Invoice**: Generate PDF invoices on successful payment
- **Tax**: Add tax calculation based on customer location
- **Multi-currency**: Support payments in multiple currencies

## Further Reading

- [Stripe Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe React Stripe.js](https://stripe.com/docs/stripe-js/react)
- [Testing Stripe Payments](https://stripe.com/docs/testing)
