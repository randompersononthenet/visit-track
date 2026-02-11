import './globals.css';

export const metadata = {
  title: 'VisitTrack Pre-Registration',
  description: 'Submit basic visit details ahead of time',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-100 text-slate-900 antialiased min-h-screen">
        <main className="max-w-2xl mx-auto py-8 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
