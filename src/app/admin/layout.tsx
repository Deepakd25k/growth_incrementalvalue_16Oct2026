import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin | D2C Audit", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}
