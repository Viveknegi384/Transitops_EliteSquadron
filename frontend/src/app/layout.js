import './globals.css';

export const metadata = {
  title: 'TransitOps - Smart Transport Operations Platform',
  description: 'Manage fleet assets, driver profiles, dispatch workflows, maintenance logs, and financial analytics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
