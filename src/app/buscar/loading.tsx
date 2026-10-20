export default function Loading() {
  return (
    <div className="container loading-state" role="status">
      <div className="loading-line" />
      <h2>Encontrando novas possibilidades…</h2>
      <div className="property-grid">
        {[1, 2, 3].map((i) => (
          <div className="skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}
