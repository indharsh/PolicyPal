export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <div className="brand-mark">
          <span className="brand-dot" />
          PolicyPal
        </div>
        <div className="brand-body">
          <h1>Understand any policy, in plain answers.</h1>
          <p>
            Upload an insurance or HR policy and ask questions. Every answer comes with
            the exact clause it was drawn from.
          </p>
        </div>
      </aside>
      <main className="auth-panel">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
