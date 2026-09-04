import { collection, config, fields, type ComponentSchema } from '@keystatic/core';
import canonicalJson from './content-site/en.json';
import type { SiteStrings } from './lib/site-strings';

const canonical = canonicalJson satisfies SiteStrings;

type EditableJson = string | EditableJson[] | { [key: string]: EditableJson };

const labelOverrides: Record<string, string> = {
  cn: 'Chinese',
  fumadocs: 'Fumadocs UI',
  home: 'Homepage',
  htmlLang: 'HTML language',
  mishkat: 'Mishkāt',
  mishkatCitations: 'Mishkāt citations',
  quran: 'Qurʾān',
};

function fieldLabel(key: string): string {
  if (labelOverrides[key]) return labelOverrides[key];
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase());
}

function shouldBeMultiline(key: string, value: string): boolean {
  return value.length > 80 || /(description|gloss|lead|line|quote|reveal|text)$/i.test(key);
}

function fieldFor(key: string, value: EditableJson): ComponentSchema {
  if (typeof value === 'string') {
    return fields.text({
      label: fieldLabel(key),
      multiline: shouldBeMultiline(key, value),
      validation: { isRequired: true },
    });
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error(`Keystatic cannot infer an empty array field: ${key}`);
    }

    return fields.array(fieldFor(key, value[0]), {
      label: fieldLabel(key),
      validation: { length: { min: 1 } },
    });
  }

  return fields.object(schemaFor(value), { label: fieldLabel(key) });
}

function schemaFor(value: Record<string, EditableJson>): Record<string, ComponentSchema> {
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, fieldFor(key, child)]),
  );
}

const { locale: _locale, ...editableStrings } = canonical;

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'VaultPress site strings' },
    navigation: { Content: ['site'] },
  },
  collections: {
    site: collection({
      label: 'Site strings by locale',
      path: 'content-site/*',
      format: { data: 'json' },
      entryLayout: 'form',
      slugField: 'locale',
      schema: {
        locale: fields.slug({
          name: {
            label: 'Locale',
            description: 'Do not rename here. Use the add-locale workflow to add or change locale codes.',
          },
          slug: { label: 'Locale code' },
        }),
        ...schemaFor(editableStrings as unknown as Record<string, EditableJson>),
      },
    }),
  },
});
