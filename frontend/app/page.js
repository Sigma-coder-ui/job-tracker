"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let data;
      if (mode === "register") {
        data = await api("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
      } else {
        data = await api("/auth/login", { method: "POST", body: new URLSearchParams({ username: email, password }) });
      }
      localStorage.setItem("token", data.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-side">
        <h1>Every application, one clear list.</h1>
        <p>Log each job you apply to, move it from Applied to Offer, and never forget a follow-up.</p>
      </section>
      <form className="auth-form" onSubmit={submit}>
        <h2>{mode === "login" ? "Log in" : "Create your account"}</h2>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
        <p className="switch">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </form>
    </main>
  );
}
