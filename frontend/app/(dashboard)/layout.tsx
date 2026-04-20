import Link from 'next/link';
import { InterwovenActions } from '@/components/InterwovenActions';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.className} style={{ background: '#111111', color: '#ffffff', minHeight: '100vh' }}>
      <nav className="nav-pill">
        <span className="nav-brand">◈ NEURALIS</span>
        <div className="nav-sep" />
        <Link href="/"          className="nav-link">Home</Link>
        <Link href="/vault"     className="nav-link">Vault</Link>
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
        <Link href="/arena"     className="nav-link">Arena</Link>
        <div className="nav-sep" />
        <InterwovenActions />
      </nav>
      <main style={{ paddingTop: 72 }}>
        {children}
      </main>
    </div>
  );
}
