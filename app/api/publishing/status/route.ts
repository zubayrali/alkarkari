import { readAffinePublishingStatus } from "@/lib/affine/publishing-status";
import { currentLocale } from "@/lib/locales-manifest";

// Required by the repository's static export. In development Next executes the
// handler from the filesystem; production exports only the deliberate 404.
export const dynamic = "force-static";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  return Response.json(await readAffinePublishingStatus(currentLocale()), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
