import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page error-page">
      <div className="container error-card">
        <span className="eyebrow">404</span>
        <h1>Deze pagina bestaat niet.</h1>
        <p>Ga terug naar de homepage.</p>
        <Link href="/" className="button button-primary">
          Naar homepage
        </Link>
      </div>
    </main>
  );
}
