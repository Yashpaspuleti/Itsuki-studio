import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Package,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/store";
import { apiRequest } from "../../lib/api";
import "./account.css";

export function AccountPage() {
  const { user, loading, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await apiRequest("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
        }),
      });
      await refresh();
      setMessage("Your account details have been updated.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <main className="account-page account-page--state">
        <div className="account-loading" role="status">
          Loading your account…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="account-page account-page--state">
        <section className="account-signin-card">
          <div className="account-signin-icon">
            <LockKeyhole size={24} />
          </div>
          <p className="account-eyebrow">MEMBERS AREA</p>
          <h1>Sign in to your account</h1>
          <p>View your profile and keep track of every Itsuki order.</p>
          <Link className="account-primary-button" to="/login">
            Sign in <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    );
  }

  const firstName = user.name.trim().split(" ")[0] || "there";
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="account-page">
      <div className="account-shell">
        <Link className="account-back-link" to="/">
          <ArrowLeft size={16} /> Back to store
        </Link>

        <header className="account-hero">
          <div className="account-avatar" aria-hidden="true">
            {initials}
          </div>
          <div>
            <p className="account-eyebrow">YOUR ITSUKI ACCOUNT</p>
            <h1>Hello, {firstName}.</h1>
            <p>{user.email}</p>
          </div>
        </header>

        <div className="account-layout">
          <form className="account-profile-card" onSubmit={save}>
            <div className="account-card-heading">
              <div className="account-card-icon">
                <UserRound size={19} />
              </div>
              <div>
                <p className="account-card-kicker">PROFILE</p>
                <h2>Personal details</h2>
              </div>
            </div>

            <div className="account-fields">
              <label>
                <span>Full name</span>
                <input
                  name="name"
                  defaultValue={user.name}
                  required
                  minLength={2}
                />
              </label>
              <label>
                <span>Email address</span>
                <input value={user.email} disabled readOnly />
              </label>
              <label>
                <span>Phone number</span>
                <input
                  name="phone"
                  defaultValue={user.phone ?? ""}
                  placeholder="Add your phone number"
                />
              </label>
            </div>

            {message && (
              <p className="account-success" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="account-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="account-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
              {!saving && <ArrowRight size={16} />}
            </button>
          </form>

          <aside className="account-actions-card">
            <div className="account-card-heading">
              <div className="account-card-icon">
                <Package size={19} />
              </div>
              <div>
                <p className="account-card-kicker">ORDERS</p>
                <h2>My account</h2>
              </div>
            </div>

            <nav className="account-action-list" aria-label="Account actions">
              <Link to="/orders">
                <span className="account-action-icon">
                  <Package size={18} />
                </span>
                <span>
                  <strong>Order history</strong>
                  <small>Track purchases and deliveries</small>
                </span>
                <ArrowRight size={16} />
              </Link>

              {user.role === "ADMIN" && (
                <Link to="/admin">
                  <span className="account-action-icon">
                    <LayoutDashboard size={18} />
                  </span>
                  <span>
                    <strong>Admin dashboard</strong>
                    <small>Manage store and inventory</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )}

              <button type="button" onClick={handleSignOut}>
                <span className="account-action-icon">
                  <LogOut size={18} />
                </span>
                <span>
                  <strong>Sign out</strong>
                  <small>End this session securely</small>
                </span>
                <ArrowRight size={16} />
              </button>
            </nav>
          </aside>
        </div>
      </div>
    </main>
  );
}
