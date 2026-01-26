"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    User,
    Phone,
    Calendar,
    MessageSquare
} from "lucide-react";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { getClients } from "./actions";

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin");
        if (!isAdmin) {
            router.push("/admin/login");
            return;
        }
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
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
                            src="/logo-salon.png?v=1.2"
                            alt="Logo"
                            width={28}
                            height={28}
                            className="object-cover"
                        />
                    </div>
                    <h1 className="text-xl font-bold">Clientes</h1>
                </div>
            </header>

            <div className="container mx-auto p-4 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-700 text-sm">
                    Aquí puedes ver el historial de tus clientes y contactarlos.
                </div>

                {loading ? (
                    <p className="text-center py-10 text-slate-500">Cargando clientes...</p>
                ) : clients.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <User className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                        <p className="text-slate-500">No hay clientes registrados</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {clients.map((client) => (
                            <Card key={client.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{client.name}</CardTitle>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={`https://wa.me/${client.phone}`} target="_blank">
                                                <MessageSquare className="h-4 w-4 text-green-600" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3" />
                                            {client.phone}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            {client.appointments?.length || 0} turnos en total
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 px-4 shadow-lg">
                <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-slate-400" onClick={() => router.push("/admin/dashboard")}>
                    <Calendar className="h-6 w-6" />
                    <span className="text-[10px]">Agenda</span>
                </Button>
                <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-primary">
                    <User className="h-6 w-6" />
                    <span className="text-[10px]">Clientes</span>
                </Button>
            </nav>
            <Footer />
        </main>
    );
}
