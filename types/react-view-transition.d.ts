// types/react-view-transition.d.ts
//
// `react@19.2.x` (the version pinned in package.json / @types/react) does not
// yet export `ViewTransition`. Next.js aliases `react` inside `app/` to its
// vendored `react-builtin`, which DOES export it at runtime — this shim only
// fixes type-checking. Delete once @types/react ships real types for it
// (a duplicate declaration will then error, surfacing the cleanup point).
import 'react';

declare module 'react' {
  type ViewTransitionClass = 'none' | 'auto' | (string & {});
  type ViewTransitionClassPerType =
    | ViewTransitionClass
    | Record<string, ViewTransitionClass>;

  export const ViewTransition: React.ComponentType<{
    name?: string;
    share?: ViewTransitionClassPerType;
    enter?: ViewTransitionClassPerType;
    exit?: ViewTransitionClassPerType;
    update?: ViewTransitionClassPerType;
    layout?: ViewTransitionClassPerType;
    default?: ViewTransitionClassPerType;
    children?: React.ReactNode;
  }>;
}
