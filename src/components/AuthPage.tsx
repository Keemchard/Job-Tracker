"use client";

import { useState } from "react";
import { IoLogoGoogle } from "react-icons/io5";
import { useAuth } from "./AuthProvider";
import styles from "@/styles/auth.module.scss";

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        if (!name.trim()) {
          setError("Please enter your name.");
          setSubmitting(false);
          return;
        }
        await signUp(email, password, name.trim());
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#6366f1"/>
              <text x="5" y="22" fontFamily="monospace" fontWeight="800" fontSize="15" fill="white">&gt;_</text>
            </svg>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text-primary)" }}>
              hired<span style={{ color: "#6366f1" }}>.log</span>
            </h1>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>Your job hunt, documented.</p>
        </div>

        <h2 className={styles.title}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className={styles.subtitle}>
          {mode === "login"
            ? "Sign in to access your applications"
            : "Start tracking your job hunt"}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button className={styles.googleBtn} onClick={handleGoogle}>
          <IoLogoGoogle />
          Continue with Google
        </button>

        <div className={styles.footer}>
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button onClick={switchMode}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={switchMode}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
