'use client';

import { useState } from 'react';
import { Crown, X } from 'lucide-react';

type ClaimListingDialogProps = {
  classItem: {
    id: string | number;
    name?: string;
  };
};

type SubmissionStatus =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | { type: 'loading' };

export function ClaimListingDialog({ classItem }: ClaimListingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>({ type: 'idle' });

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setBusinessName('');
    setStatus({ type: 'idle' });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus({ type: 'loading' });

    try {
      const response = await fetch('/api/claim-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classItem.id,
          email,
          phone,
          businessName,
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setStatus({
        type: 'success',
        message: "Thanks! We'll verify your details and be in touch within 24 hours.",
      });
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message: 'We were unable to submit your claim. Please try again shortly.',
      });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          resetForm();
          setIsOpen(true);
        }}
        className="inline-flex items-center rounded-md border border-purple-200 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm transition hover:border-purple-300 hover:text-purple-800"
      >
        <Crown className="mr-2 h-4 w-4" />
        Claim This Listing
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Claim your business listing</h3>
                <p className="text-sm text-slate-500">
                  {classItem.name ? `Listing: ${classItem.name}` : 'Provide your business details below.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-700">
                <p className="font-medium">What you'll unlock:</p>
                <ul className="mt-2 space-y-1">
                  <li>✓ Update your class information instantly</li>
                  <li>✓ Add photos, social links, and booking details</li>
                  <li>✓ Access engagement analytics</li>
                  <li>✓ Respond to parent reviews</li>
                </ul>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Business name
                <input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Your business name"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Business email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@business.com"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Phone number
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="07xxx xxx xxx"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={status.type === 'loading'}
                className="flex w-full items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {status.type === 'loading' ? 'Submitting…' : 'Submit claim request'}
              </button>

              {status.type === 'success' && (
                <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{status.message}</p>
              )}
              {status.type === 'error' && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{status.message}</p>
              )}

              <p className="text-center text-xs text-slate-400">
                We will verify your details and send secure login credentials within 24 hours.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
