import fs from 'node:fs/promises';
import path from 'node:path';
import { AffineDatabaseView } from '@/components/affine-database-view';
import type { AffineDatabaseSnapshot } from '@/lib/affine/database-types';

export async function AffineDatabase({ src }: { src: string }) {
  if (!src.startsWith('/affine-database/') || src.includes('..')) {
    return <p className="affine-db-error">Database source is not valid.</p>;
  }

  try {
    const filePath = path.join(process.cwd(), 'public', src);
    const snapshot = JSON.parse(await fs.readFile(filePath, 'utf8')) as AffineDatabaseSnapshot;
    return <AffineDatabaseView snapshot={snapshot} />;
  } catch {
    return <p className="affine-db-error">This database is not available in the publication snapshot.</p>;
  }
}

