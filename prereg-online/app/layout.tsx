export const metadata = {
  title: 'VisitTrack Pre-Registration',
  description: 'Submit basic visit details ahead of time',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial' }}>
        <main style={{ maxWidth: 640, margin: '2rem auto', padding: '1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
