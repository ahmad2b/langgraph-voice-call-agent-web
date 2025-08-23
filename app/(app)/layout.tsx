import { headers } from 'next/headers';
import Link from 'next/link';
import { getAppConfig } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const hdrs = await headers();
  const { companyName } = await getAppConfig(hdrs);

  return (
    <>
      <header className="fixed top-0 left-0 z-50 hidden w-full flex-row justify-between p-6 md:flex">
        <Link
          href="/"
          className="text-foreground font-mono text-xs font-bold tracking-wider uppercase"
        >
          {companyName}
        </Link>
      </header>
      {children}
    </>
  );
}
