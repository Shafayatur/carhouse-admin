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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <svg className="mx-auto mb-4" height="44" viewBox="0 0 260 72" fill="none">
            <rect x="1" y="1" width="70" height="70" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
            <text x="14" y="54" fontFamily="serif" fontWeight="300" fontSize="52" fill="white">H</text>
            <line x1="71" y1="16" x2="90" y2="16" stroke="white" strokeWidth="1.5"/>
            <line x1="71" y1="56" x2="90" y2="56" stroke="white" strokeWidth="1.5"/>
            <rect x="90" y="10" width="168" height="52" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
            <text x="104" y="38" fontFamily="sans-serif" fontWeight="700" fontSize="20" fill="white" letterSpacing="3">CAR HOUSE</text>
            <text x="118" y="54" fontFamily="sans-serif" fontWeight="400" fontSize="11" fill="white" letterSpacing="4">IMPORTS LTD.</text>
          </svg>
          <p className="text-zinc-600 text-xs tracking-[0.3em] uppercase">Management System</p>
        </div>
        <div className="border border-white/10 p-8 bg-[#0a0a0a]">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@carhouse.com.bd"
                className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600"
              />
            </div>
            {error && <p className="text-xs text-red-400 tracking-wide">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-white text-black text-xs font-semibold tracking-[0.25em] uppercase hover:bg-zinc-200 transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
