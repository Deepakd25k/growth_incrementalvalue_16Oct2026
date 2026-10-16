const MESSAGES: Record<string, string> = {
  invalid: "Wrong username or password.",
  locked: "Too many attempts. Try again in 15 minutes.",
  config: "Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="container">
      <div className="login card">
        <span className="eyebrow">Admin</span>
        <h1 style={{ fontSize: 26, marginTop: 8 }}>Sign in</h1>
        <form method="post" action="/api/admin/login">
          <div className="field">
            <label htmlFor="u">Username</label>
            <input id="u" name="username" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="p">Password</label>
            <input id="p" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && MESSAGES[error] && <div className="form-error">{MESSAGES[error]}</div>}
          <button className="btn btn-block" style={{ marginTop: 18 }}>Sign in</button>
        </form>
      </div>
    </main>
  );
}
