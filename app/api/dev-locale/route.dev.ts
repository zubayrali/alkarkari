import { writeFile } from "node:fs/promises";
import path from "node:path";
import { currentLocale } from "@/lib/locales-manifest";

const supportedLocales = new Set(["en", "fr", "cn"]);

export function GET() {
  return Response.json({ locale: currentLocale() });
}

export async function POST(request: Request) {
  const { locale } = (await request.json()) as { locale?: string };
  if (!locale || !supportedLocales.has(locale)) {
    return Response.json({ error: "Unknown language." }, { status: 400 });
  }

  const supervisorPid = Number(process.env.AFFINE_DEV_SUPERVISOR_PID);
  if (!Number.isSafeInteger(supervisorPid) || supervisorPid <= 0) {
    return Response.json(
      { error: "Start the site with pnpm dev to switch collections locally." },
      { status: 409 },
    );
  }

  await writeFile(path.join(process.cwd(), ".dev-locale-request"), `${locale}\n`, "utf8");
  setTimeout(() => process.kill(supervisorPid, "SIGUSR2"), 300).unref();

  return Response.json({ switching: true, locale }, { status: 202 });
}
