'use client';

import { BookOpen, Shapes } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type DocumentViewMode = 'page' | 'canvas';

type DocumentViewContextValue = {
  mode: DocumentViewMode;
  showPage: () => void;
  showCanvas: () => void;
};

const DocumentViewContext = createContext<DocumentViewContextValue | null>(null);

export function DocumentViewProvider({
  children,
  hasCanvas,
}: {
  children: ReactNode;
  hasCanvas: boolean;
}) {
  const [mode, setMode] = useState<DocumentViewMode>('page');
  const showPage = useCallback(() => setMode('page'), []);
  const showCanvas = useCallback(() => {
    if (hasCanvas) setMode('canvas');
  }, [hasCanvas]);

  useEffect(() => {
    document.documentElement.dataset.documentView = mode;
    return () => {
      delete document.documentElement.dataset.documentView;
    };
  }, [mode]);

  useEffect(() => {
    if (!hasCanvas && mode === 'canvas') setMode('page');
  }, [hasCanvas, mode]);

  useEffect(() => {
    if (mode !== 'canvas') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      event.preventDefault();
      showPage();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mode, showPage]);

  const value = useMemo(
    () => ({ mode, showPage, showCanvas }),
    [mode, showCanvas, showPage],
  );

  return (
    <DocumentViewContext.Provider value={value}>
      {children}
    </DocumentViewContext.Provider>
  );
}

export function useDocumentView() {
  return useContext(DocumentViewContext);
}

function ViewButtons({ floating = false }: { floating?: boolean }) {
  const view = useDocumentView();
  if (!view) return null;

  return (
    <div
      className={floating ? 'document-view-switch document-view-switch--floating' : 'document-view-switch'}
      role="group"
      aria-label="Document view"
    >
      <button
        type="button"
        className="document-view-switch__button"
        data-active={view.mode === 'page'}
        aria-pressed={view.mode === 'page'}
        onClick={view.showPage}
        title="Page view"
      >
        <BookOpen aria-hidden className="size-3.5" />
        <span>Page</span>
      </button>
      <button
        type="button"
        className="document-view-switch__button"
        data-active={view.mode === 'canvas'}
        aria-pressed={view.mode === 'canvas'}
        onClick={view.showCanvas}
        title="Canvas view"
      >
        <Shapes aria-hidden className="size-3.5" />
        <span>Canvas</span>
      </button>
    </div>
  );
}

export function DocumentViewToggle() {
  const view = useDocumentView();
  if (!view) return null;

  return view.mode === 'canvas'
    ? createPortal(<ViewButtons floating />, document.body)
    : <ViewButtons />;
}

export function DocumentViewContent({
  page,
  canvas,
}: {
  page: ReactNode;
  canvas?: ReactNode;
}) {
  const view = useDocumentView();
  if (!view || !canvas || view.mode === 'page') return page;
  return canvas;
}
