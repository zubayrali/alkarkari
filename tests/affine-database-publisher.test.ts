import { describe, expect, it } from 'vitest';
import { findAffineDatabaseBlockIds, replaceAffineDatabaseMarkers } from '../lib/affine/database-publisher';

describe('AFFiNE database publication markers', () => {
  it('finds escaped block IDs and replaces them in place', () => {
    const markdown = 'Before\n\n<!-- unsupported: flavour=affine:database blockId=db&#45;one -->\n\nAfter';
    expect(findAffineDatabaseBlockIds(markdown)).toEqual(['db-one']);
    expect(replaceAffineDatabaseMarkers(markdown, new Map([['db-one', '/affine-database/doc/db-one.json']]))).toContain(
      '<AffineDatabase src="/affine-database/doc/db-one.json" />',
    );
  });

  it('leaves unavailable database markers intact', () => {
    const markdown = '<!-- unsupported: flavour=affine:database blockId=db -->';
    expect(replaceAffineDatabaseMarkers(markdown, new Map())).toBe(markdown);
  });
});

