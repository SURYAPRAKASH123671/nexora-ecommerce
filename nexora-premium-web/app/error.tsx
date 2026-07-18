"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-state-page">
      <section className="error-state-card" role="alert" aria-labelledby="error-title">
        <div className="brand-mark" aria-hidden="true">N</div>
        <span className="eyebrow">Something went wrong</span>
        <h1 id="error-title">We couldn’t load this experience.</h1>
        <p>Your bag and saved items are safe. Check your connection and retry, or return to the storefront.</p>
        <div className="error-actions">
          <button className="primary" onClick={reset}>Try again</button>
          <a className="secondary" href="/">Return home</a>
        </div>
      </section>
    </main>
  );
}
