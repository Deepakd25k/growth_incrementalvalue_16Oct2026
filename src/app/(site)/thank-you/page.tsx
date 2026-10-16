import type { Metadata } from "next";
import { Suspense } from "react";
import { Header, Footer } from "@/components/Chrome";
import { ThankYou } from "./ThankYou";

export const metadata: Metadata = { title: "Payment confirmed | D2C Growth Audit", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <>
      <Header cta={false} />
      <main className="page grid-bg">
        <div className="container">
          <Suspense>
            <ThankYou />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
