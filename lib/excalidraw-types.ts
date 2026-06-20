export interface ExcalidrawData {
  type: "excalidraw";
  version: number;
  source?: string;
  elements: ExcalidrawElement[];
  appState: Partial<ExcalidrawAppState>;
  files: Record<string, ExcalidrawFileData>;
  embeddedFiles?: Record<string, string>;
}

export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  seed: number;
  isDeleted: boolean;
  roundness: { type: number; value?: number } | null;
  points?: Array<[number, number]>;
  text?: string;
  rawText?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: string;
  verticalAlign?: string;
  fileId?: string;
  startBinding?: unknown;
  endBinding?: unknown;
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  groupIds?: string[];
  frameId?: string | null;
  boundElements?: Array<{ id: string; type: string }> | null;
  link?: string | null;
  simulatePressure?: boolean;
  [key: string]: unknown;
}

export interface ExcalidrawAppState {
  viewBackgroundColor: string;
  exportBackground: boolean;
  exportWithDarkMode: boolean;
  gridSize?: number | null;
  [key: string]: unknown;
}

export interface ExcalidrawFileData {
  mimeType: string;
  id: string;
  dataURL: string;
  created: number;
  lastRetrieved?: number;
}

export interface ExcalidrawRenderOptions {
  enableInteraction?: boolean;
  darkMode?: "auto" | "light" | "dark";
  exportPadding?: number;
}
