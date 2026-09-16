"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === "admin" && password === "admin123") {
      localStorage.setItem("isAdmin", "true");
      router.push("/admin/dashboard");
    } else {
      setError("Credenciales incorrectas. Prueba con: admin / admin123");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
      {/* Cabecera limpia sin enlaces de clientas */}
      <header className="w-full bg-[#FFFFFF] border-b border-[#F5F0E6] py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-cinzel text-lg font-bold text-[#2B2B2B]">
            ÁGAPE STUDIO
          </span>
          <Link
            href="/"
            className="text-xs text-[#737373] hover:text-[#2B2B2B] transition-colors"
          >
            ← Ir al sitio público
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl border border-[#DCC5A3]/50 shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#F5F0E6] border border-[#D4AF37] flex items-center justify-center mx-auto mb-3 shadow-2xs text-[#D4AF37]">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
              Área Exclusiva de Manicurista
            </span>
            <h1 className="font-cinzel text-2xl font-bold text-[#2B2B2B] mt-1">
              ÁGAPE STUDIO
            </h1>
            <p className="text-xs text-[#737373] font-light mt-1">
              Ingresa tus credenciales para administrar turnos, agenda y clientas.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Usuario</span>
              </label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#2B2B2B] bg-[#FAF8F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Contraseña</span>
              </label>
              <input
                type="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#2B2B2B] bg-[#FAF8F5]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-full bg-[#2B2B2B] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-all shadow-md cursor-pointer"
            >
              <span>Acceder al Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#F5F0E6] text-center text-xs text-[#737373]">
            <p className="font-light">
              Credenciales por defecto: <strong className="text-[#2B2B2B]">admin</strong> / <strong className="text-[#2B2B2B]">admin123</strong>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
