import fs from "node:fs";
import path from "node:path";
import type { ExcalidrawData } from "@/lib/excalidraw-types";
import { renderToSvg } from "@/lib/excalidraw-renderer";
import { ExcalidrawViewer } from "./excalidraw-view";

interface ExcalidrawPageContentProps {
  src: string;
}

export function ExcalidrawPageContent({ src }: ExcalidrawPageContentProps) {
  const filePath = path.join(process.cwd(), "public", src);

  let data: ExcalidrawData;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    data = JSON.parse(raw);
  } catch {
    return (
      <p className="text-sm text-fd-muted-foreground">
        Excalidraw drawing not found: {src}
      </p>
    );
  }

  const result = renderToSvg(data);
  const bgColor = result.svg.match(/data-bg-color="([^"]+)"/)?.[1];

  return <ExcalidrawViewer svgHtml={result.svg} bgColor={bgColor} />;
}
