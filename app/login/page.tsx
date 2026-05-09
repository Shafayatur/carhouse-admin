"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: "#c9a84c", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#0f1117", margin: "0 auto 16px" }}>H</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#f0f2f7", marginBottom: 4 }}>Car House Imports</p>
          <p style={{ fontSize: 12, color: "#6b7590", letterSpacing: "0.08em", textTransform: "uppercase" }}>Management System</p>
        </div>
        <div style={{ background: "#161b25", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6b7590", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@carhouse.com.bd"
              style={{ width: "100%", background: "#1e2535", border: "1px solid rgba(255,255,255,0.14)", color: "#f0f2f7", fontFamily: "inherit", fontSize: 14, padding: "10px 14px", borderRadius: 6, outline: "none" }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6b7590", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", background: "#1e2535", border: "1px solid rgba(255,255,255,0.14)", color: "#f0f2f7", fontFamily: "inherit", fontSize: 14, padding: "10px 14px", borderRadius: 6, outline: "none" }}
            />
          </div>
          {error && <p style={{ fontSize: 12, color: "#e05252", marginBottom: 12 }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", padding: "11px", background: "#c9a84c", color: "#0f1117", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
