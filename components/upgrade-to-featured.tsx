'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Crown, Check } from 'lucide-react';

type UpgradeToFeaturedProps = {
  classId: number | string;
};

type UpgradeStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export function UpgradeToFeatured({ classId }: UpgradeToFeaturedProps) {
  const [status, setStatus] = useState<UpgradeStatus>({ type: 'idle' });

  const handleUpgrade = async () => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      setStatus({
        type: 'error',
        message: 'Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout.',
      });
      return;
    }

    setStatus({ type: 'loading' });

    try {
      const stripe = await loadStripe(publishableKey);

      if (!stripe) {
        throw new Error('Unable to initialise Stripe.');
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, priceId: 'price_featured_listing' }),
      });

      if (!response.ok) {
        throw new Error('Checkout session request failed.');
      }

      const { sessionId } = await response.json();

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }

      setStatus({ type: 'success', message: 'Redirecting you to Stripe Checkout…' });
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message: 'We could not start checkout. Please try again or contact support.',
      });
    }
  };

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-amber-500 p-3">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-bold text-gray-900">Upgrade to Featured</h3>
          <p className="mb-4 text-gray-600">Get 3× more visibility and bookings</p>
          <ul className="mb-6 space-y-2">
            {[
              'Appear at the top of search results',
              'Gold badge highlighting across the site',
              'Priority inclusion in parent newsletters',
              'Featured social media shout-outs',
              'Monthly engagement analytics report',
            ].map((benefit) => (
              <li key={benefit} className="flex items-center text-sm text-gray-700">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                {benefit}
              </li>
            ))}
          </ul>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">£10</span>
            <span className="text-gray-600">/month per location</span>
          </div>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={status.type === 'loading'}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-75"
          >
            <Crown className="h-4 w-4" />
            {status.type === 'loading' ? 'Preparing checkout…' : 'Upgrade now'}
          </button>
          {status.type === 'success' && (
            <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status.message}</p>
          )}
          {status.type === 'error' && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{status.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
