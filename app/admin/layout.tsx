import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen text-[#171717] dark:text-[#F5F5F5] bg-[#FAF8F5] dark:bg-[#0D0D0D] transition-colors duration-200">
      {children}
    </div>
  );
}
