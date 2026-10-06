import { useState } from "react";
import api from "../api/client.js";
import { authStore } from "../api/authStore.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("sales@fundsroom.local");
  const [password, setPassword] = useState("Welcome@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const auth = await api.post("/auth/login", { email, password });
      authStore.set(auth);
      onLogin(auth);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div>
          <h1>Fundsroom ERP</h1>
          <p>Sign in to continue.</p>
        </div>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
