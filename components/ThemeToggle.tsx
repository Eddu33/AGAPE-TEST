"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "icon" | "full";
  className?: string;
}

export default function ThemeToggle({
  variant = "icon",
  className = "",
}: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    const isDarkTheme = savedTheme
      ? savedTheme === "dark"
      : document.documentElement.classList.contains("dark");

    setIsDark(isDarkTheme);
    if (isDarkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    window.addEventListener("themechange", handleThemeChange);
    return () => window.removeEventListener("themechange", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    window.dispatchEvent(new Event("themechange"));
  };

  // Evita layout shift antes de montar
  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full border border-[#333333] bg-[#1A1A1A]/50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border cursor-pointer ${
          isDark
            ? "bg-[#1E1E1E] text-[#F5F5F5] border-[#333333] hover:border-[#D4AF37] hover:bg-[#252525]"
            : "bg-[#F3EFEA] text-[#171717] border-[#E2DBD0] hover:border-[#C5A059] hover:bg-[#EAE4DC]"
        } ${className}`}
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark
                ? "bg-[#282828] text-[#D4AF37]"
                : "bg-[#FFFFFF] text-[#C5A059] shadow-sm"
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#D4AF37]" />
            ) : (
              <Moon className="w-4 h-4 text-[#C5A059]" />
            )}
          </div>
          <div className="text-left">
            <span className="block text-xs font-semibold">
              {isDark ? "Modo Oscuro" : "Modo Claro"}
            </span>
            <span className="block text-[10px] text-opacity-70">
              {isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            </span>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isDark
              ? "bg-[#2A2A2A] text-[#D4AF37]"
              : "bg-[#FFFFFF] text-[#C5A059] border border-[#E2DBD0]"
          }`}
        >
          {isDark ? "Oscuro" : "Claro"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-full transition-all duration-300 border cursor-pointer group flex items-center justify-center ${
        isDark
          ? "bg-[#1C1C1C] border-[#333333] text-[#D4AF37] hover:bg-[#262626] hover:border-[#D4AF37] shadow-sm"
          : "bg-[#FFFFFF] border-[#E2DBD0] text-[#C5A059] hover:bg-[#F3EFEA] hover:border-[#C5A059] shadow-sm"
      } ${className}`}
      title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45 text-[#D4AF37]" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12 text-[#C5A059]" />
      )}
    </button>
  );
}
