export default function NotFound() {
  return (
    <main className="error-state-page">
      <section className="error-state-card" aria-labelledby="not-found-title">
        <div className="brand-mark" aria-hidden="true">N</div>
        <span className="eyebrow">Error 404</span>
        <h1 id="not-found-title">This page slipped out of the bag.</h1>
        <p>The address may have changed, or the product is no longer available. Your saved bag and account remain unchanged.</p>
        <div className="error-actions">
          <a className="primary" href="/">Return home</a>
          <a className="secondary" href="/shop">Browse products</a>
        </div>
      </section>
    </main>
  );
}
