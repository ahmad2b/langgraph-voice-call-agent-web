import { headers } from 'next/headers';
import { App } from '@/components/app';
import { getAppConfig } from '@/lib/utils';

export default async function Page() {
  const header = await headers();
  const appConfig = await getAppConfig(header);

  return <App appConfig={appConfig} />;
}
