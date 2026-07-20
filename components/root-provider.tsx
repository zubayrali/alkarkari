'use client';

import { RootProvider as FumadocsProvider } from 'fumadocs-ui/provider/next';
import { useMemo, type ComponentProps } from 'react';
import SearchDialog, { type SearchStrings } from './search-dialog';

type Props = Omit<ComponentProps<typeof FumadocsProvider>, 'search'> & {
  searchStrings?: SearchStrings;
};

export function RootProvider({ searchStrings, ...props }: Props) {
  const search = useMemo(
    () => ({
      SearchDialog: (p: { open: boolean; onOpenChange: (open: boolean) => void }) => (
        <SearchDialog {...p} strings={searchStrings} />
      ),
    }),
    [searchStrings],
  );
  return <FumadocsProvider {...props} search={search} />;
}
