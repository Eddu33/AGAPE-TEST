"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

export default function AdminLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded login for MVP - Case insensitive for username
        if (username.toLowerCase() === "admin" && password === "admin123") {
            // In a real app, use next-auth or similar
            localStorage.setItem("isAdmin", "true");
            router.push("/admin/dashboard");
        } else {
            setError("Credenciales incorrectas");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 overflow-hidden rounded-full shadow-md">
                        <Image
                            src="/logo-salon.png"
                            alt="Logo"
                            width={80}
                            height={80}
                            className="object-cover"
                        />
                    </div>
                    <CardTitle className="text-2xl">Panel de Control</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales para administrar los turnos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Usuario</Label>
                            <Input
                                id="username"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">
                            Iniciar Sesión
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <Footer />
        </main>
    );
}
