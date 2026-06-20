'use client';

import { RootProvider as FumadocsProvider } from 'fumadocs-ui/provider/next';
import type { ComponentProps } from 'react';
import SearchDialog from './search-dialog';

type Props = Omit<ComponentProps<typeof FumadocsProvider>, 'search'>;

export function RootProvider(props: Props) {
  return <FumadocsProvider {...props} search={{ SearchDialog }} />;
}
