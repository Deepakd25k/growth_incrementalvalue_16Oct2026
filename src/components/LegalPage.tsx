import { Header, Footer } from "./Chrome";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="page">
        <div className="container prose">
          <h1>{title}</h1>
          <p className="updated">Last updated: {updated}</p>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

