import { notFound } from "next/navigation";
import { PublishingStudio } from "@/components/publishing-studio";
import { readAffineStudioSnapshot } from "@/lib/affine/publishing-snapshot";
import { currentLocale } from "@/lib/locales-manifest";
import "@/app/publishing/publishing.css";

export default async function PublishingPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PublishingStudio snapshot={await readAffineStudioSnapshot(currentLocale())} />;
}
