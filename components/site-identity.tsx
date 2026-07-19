import { appName } from "@/lib/shared";

export function SiteIdentity() {
  return (
    <span className="site-identity">
      <span className="site-identity-latin">{appName}</span>
      <span className="site-identity-arabic kk-arabic" dir="rtl" lang="ar">
        الطريقة الكركرية
      </span>
    </span>
  );
}
