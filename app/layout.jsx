import './globals.css';

export const metadata = {
  title: 'Parent Helper',
  description: 'Discover baby and toddler activities across the United Kingdom.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <h1 className="text-xl font-semibold tracking-tight">Parent Helper</h1>
            <span className="text-sm text-slate-500">
              Built with Next.js App Router
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-6 py-4 text-sm text-slate-500">
            © {new Date().getFullYear()} Parent Helper. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
