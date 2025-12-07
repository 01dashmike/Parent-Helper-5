// app/provider/dev/page.tsx

import { redirect } from "next/navigation";

import Link from "next/link";



export const dynamic = "force-dynamic";



export default function ProviderDevPage() {

  // Never expose this in production

  if (process.env.NODE_ENV !== "development") {

    redirect("/");

  }



  return (

    <main className="min-h-screen bg-[#f7f3ee] px-4 py-16">

      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-lg border border-gray-200">

        <header className="mb-6">

          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">

            Dev tools

          </p>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">

            Provider Dev Preview

          </h1>

          <p className="text-sm text-gray-600">

            This is a <strong>development-only</strong> page. No Supabase auth,

            no magic links, no server actions — just static links to help me

            explore provider flows without breaking anything.

          </p>

        </header>



        <section className="space-y-4">

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">

            <p className="font-semibold mb-1">How to use this page</p>

            <ul className="list-disc list-inside space-y-1">

              <li>Use the links below to jump into provider flows.</li>

              <li>

                If a page redirects you back to login, that's real auth logic

                doing its job — this page itself will not auto-log you in.

              </li>

            </ul>

          </div>



          <nav className="space-y-3">

            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">

              Provider areas

            </h2>

            <div className="grid gap-3 sm:grid-cols-2">

              <Link

                href="/provider/login"

                className="block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm hover:bg-gray-100 transition"

              >

                <p className="font-medium text-gray-900">Provider login</p>

                <p className="text-xs text-gray-600">

                  Normal magic-link login flow.

                </p>

              </Link>



              <Link

                href="/provider/onboarding"

                className="block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm hover:bg-gray-100 transition"

              >

                <p className="font-medium text-gray-900">Onboarding</p>

                <p className="text-xs text-gray-600">

                  Provider onboarding journey (requires a session).

                </p>

              </Link>



              <Link

                href="/provider"

                className="block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm hover:bg-gray-100 transition"

              >

                <p className="font-medium text-gray-900">Provider console</p>

                <p className="text-xs text-gray-600">

                  Main dashboard as the real app expects it to run.

                </p>

              </Link>



              <Link

                href="/admin/dev"

                className="block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm hover:bg-amber-100 transition"

              >

                <p className="font-medium text-gray-900">Go to Admin dev</p>

                <p className="text-xs text-gray-600">

                  Shortcut to your admin dev preview (if configured).

                </p>

              </Link>

            </div>

          </nav>

        </section>

      </div>

    </main>

  );

}
