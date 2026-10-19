import { useAuth } from "../AuthContext";

// A JWT is three base64 parts. The middle one (payload) is readable by anyone.
function tokenExpiry(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

const upcoming = [
  { title: "Upload a policy", text: "Add a PDF and PolicyPal reads and indexes it for you.", status: "Next up", next: true },
  { title: "Ask questions", text: "Chat with your policy and get answers with cited clauses.", status: "Coming soon" },
  { title: "Your history", text: "Every document and conversation, saved to your account.", status: "Coming soon" },
];

export default function Home() {
  const { user, token, logout } = useAuth();
  const name = user.first_name || user.username;
  const expiry = tokenExpiry(token);

  return (
    <>
      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-dot" />
          PolicyPal
        </div>
        <div className="topbar-right">
          <span>{user.username}</span>
          <button className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="container">
        <h1>Hello, {name}</h1>
        <p className="lead">Your workspace is ready. Here is what is coming next.</p>

        <div className="grid">
          {upcoming.map((c) => (
            <div className="card" key={c.title}>
              <span className={`pill ${c.next ? "next" : ""}`}>{c.status}</span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
          ))}
        </div>

        <div className="card account">
          <h3>Your account</h3>
          <p>This is the data returned by the API's /auth/me endpoint.</p>
          <dl>
            <dt>User ID</dt><dd>{user.id}</dd>
            <dt>Username</dt><dd>{user.username}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Member since</dt><dd>{new Date(user.created_time).toLocaleString()}</dd>
            <dt>Session expires</dt><dd>{expiry ? expiry.toLocaleString() : "unknown"}</dd>
          </dl>
        </div>
      </div>
    </>
  );
}
