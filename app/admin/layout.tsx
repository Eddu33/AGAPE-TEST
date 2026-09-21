import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen text-[#F5F5F5] bg-transparent">
      {children}
    </div>
  );
}
