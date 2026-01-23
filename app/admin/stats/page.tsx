"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    Users,
    CheckCircle,
    XCircle,
    DollarSign,
    CreditCard,
    BarChart3
} from "lucide-react";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { getStats } from "../actions";

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin");
        if (!isAdmin) {
            router.push("/admin/login");
            return;
        }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        const data = await getStats();
        setStats(data);
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-10 flex items-center bg-white px-4 py-3 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.push("/admin/dashboard")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2 ml-2">
                    <div className="overflow-hidden rounded-full border shadow-sm">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={28}
                            height={28}
                            className="object-cover"
                        />
                    </div>
                    <h1 className="text-xl font-bold">Estadísticas</h1>
                </div>
            </header>

            <div className="container mx-auto p-4 space-y-6">
                {loading ? (
                    <p className="text-center py-10 text-slate-500">Cargando estadísticas...</p>
                ) : (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium text-slate-500 uppercase">Total Turnos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold">{stats.total}</span>
                                        <Users className="h-4 w-4 text-slate-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium text-slate-500 uppercase">Realizados</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-slate-500 uppercase">Cancelados / Ausentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-red-600">{stats.cancelled}</span>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    Métodos de Pago
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                        </div>
                                        <span className="font-medium">Efectivo</span>
                                    </div>
                                    <span className="text-xl font-bold">{stats.payments.cash}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <CreditCard className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className="font-medium">Transferencia</span>
                                    </div>
                                    <span className="text-xl font-bold">{stats.payments.transfer}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
                            <p className="text-sm text-primary font-medium">
                                ¡Buen trabajo! Sigue brindando el mejor servicio.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 px-4 shadow-lg">
                <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-slate-400" onClick={() => router.push("/admin/dashboard")}>
                    <ChevronLeft className="h-6 w-6" />
                    <span className="text-[10px]">Agenda</span>
                </Button>
                <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-primary" onClick={() => router.push("/admin/stats")}>
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-[10px]">Estadísticas</span>
                </Button>
            </nav>
            <Footer />
        </main>
    );
}
