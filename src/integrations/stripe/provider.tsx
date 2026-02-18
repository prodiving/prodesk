import React, { ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_none';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [stripePromiseValue, setStripePromiseValue] = React.useState<Promise<Stripe | null> | null>(null);

  React.useEffect(() => {
    setStripePromiseValue(getStripe());
  }, []);

  if (!stripePromiseValue) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromiseValue}>
      {children}
    </Elements>
  );
}
