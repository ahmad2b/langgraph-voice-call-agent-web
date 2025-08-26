import { App } from '@/components/app';
import { getAppConfig } from '@/lib/utils';
import { headers } from 'next/headers';

export default async function Page() {
  const header = await headers();
  const appConfig = await getAppConfig(header);

  return <App appConfig={appConfig} />;
}
