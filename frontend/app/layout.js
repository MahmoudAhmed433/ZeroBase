import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'ZeroBase - Trusted Company Directory',
  description: 'Industry-style trusted company directory for students.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen board-shell">
          <div className="mx-auto w-[95%] max-w-7xl py-8">
            <NavBar />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
