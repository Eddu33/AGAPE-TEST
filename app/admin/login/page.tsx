"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import { Sparkles, Lock, User, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });

      if (response.ok) {
        localStorage.setItem("isAdmin", "true");
        router.push("/admin/dashboard");
      } else {
        const data = await response.json();
        setError(data.error || "Credenciales incorrectas.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* Cabecera limpia sin enlaces de clientas */}
      <header className="w-full bg-[#121212]/90 backdrop-blur-md border-b border-[#262626] py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-cinzel text-lg font-bold text-[#FFFFFF]">
            ÁGAPE STUDIO
          </span>
          <Link
            href="/"
            className="text-xs text-[#A3A3A3] hover:text-[#D4AF37] transition-colors"
          >
            ← Ir al sitio público
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-md bg-[#161616]/90 backdrop-blur-md rounded-3xl border border-[#333333] shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#222222] border border-[#D4AF37] flex items-center justify-center mx-auto mb-3 shadow-md text-[#D4AF37]">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
              Área Exclusiva de Manicurista
            </span>
            <h1 className="font-cinzel text-2xl font-bold text-[#FFFFFF] mt-1">
              ÁGAPE STUDIO
            </h1>
            <p className="text-xs text-[#A3A3A3] font-light mt-1">
              Ingresa tus credenciales para administrar turnos, agenda y clientas.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#E0E0E0] mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Usuario</span>
              </label>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#333333] text-xs focus:outline-none focus:border-[#D4AF37] bg-[#121212] text-white placeholder:text-[#666666]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#E0E0E0] mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Contraseña</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#333333] text-xs focus:outline-none focus:border-[#D4AF37] bg-[#121212] text-white placeholder:text-[#666666]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-full bg-[#D4AF37] text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FFFFFF] transition-all shadow-lg cursor-pointer"
            >
              <span>Acceder al Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#262626] text-center text-xs text-[#888888]">
            <p className="font-light">
              Acceso restringido únicamente a personal autorizado de Ágape Studio.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
