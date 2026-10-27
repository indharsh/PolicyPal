import { useAuth } from "../AuthContext";

// A JWT is three base64 parts. The middle one (payload) is readable by anyone,
// which is how the browser can show the expiry without knowing the secret key.
function tokenExpiry(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return new Date(JSON.parse(atob(b64)).exp * 1000);
  } catch {
    return null;
  }
}

export default function Profile() {
  const { user, token, logout } = useAuth();
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const expiry = tokenExpiry(token);

  return (
    <div className="profile-page">
      <div>
        <h1>Your profile</h1>
        <p className="profile-sub">The account details PolicyPal holds for you.</p>
      </div>

      <section className="profile-card">
        <div className="profile-top">
          <span className="avatar large">{(user.first_name || user.username)[0].toUpperCase()}</span>
          <div>
            <h2>{fullName || user.username}</h2>
            <span className="pill" data-s={user.is_active ? "ready" : "failed"}>
              {user.is_active ? "Active" : "Disabled"}
            </span>
          </div>
        </div>

        <dl className="facts">
          <dt>Username</dt><dd>{user.username}</dd>
          <dt>Email</dt><dd>{user.email}</dd>
          <dt>First name</dt><dd>{user.first_name || "Not provided"}</dd>
          <dt>Last name</dt><dd>{user.last_name || "Not provided"}</dd>
          <dt>User ID</dt><dd>{user.id}</dd>
          <dt>Member since</dt><dd>{new Date(user.created_time).toLocaleString()}</dd>
        </dl>
      </section>

      <section className="profile-card">
        <h2>Session</h2>
        <p className="profile-note">
          You are signed in with a short-lived access token. When it expires you will be asked to
          sign in again.
        </p>
        <dl className="facts">
          <dt>Session expires</dt><dd>{expiry ? expiry.toLocaleString() : "Unknown"}</dd>
        </dl>
        <button className="btn-secondary" onClick={logout}>Sign out</button>
      </section>
    </div>
  );
}
