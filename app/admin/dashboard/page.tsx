"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Calendar as CalendarIcon,
    CheckCircle,
    XCircle,
    Clock,
    Trash2,
    LogOut,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    CreditCard,
    User,
    Phone
} from "lucide-react";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { getAppointments, updateAppointmentStatus, deleteAppointment } from "../actions";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from "date-fns";
import { es } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

export default function AdminDashboard() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin");
        if (!isAdmin) {
            router.push("/admin/login");
            return;
        }
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        const data = await getAppointments();
        setAppointments(data);
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("isAdmin");
        router.push("/admin/login");
    };

    const handleStatusUpdate = async (id: string, status: string, paymentMethod?: string) => {
        await updateAppointmentStatus(id, status, paymentMethod);
        setIsPaymentModalOpen(false);
        setSelectedAppointment(null);
        fetchAppointments();
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este turno?")) {
            await deleteAppointment(id);
            fetchAppointments();
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED": return <Badge className="bg-green-500">Realizado</Badge>;
            case "CANCELLED": return <Badge variant="destructive">Cancelado</Badge>;
            default: return <Badge variant="outline">Pendiente</Badge>;
        }
    };

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const getAppointmentsForDay = (day: Date) => {
        return appointments.filter(apt => isSameDay(new Date(apt.date), day));
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const dayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="overflow-hidden rounded-full border shadow-sm">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={32}
                            height={32}
                            className="object-cover"
                        />
                    </div>
                    <h1 className="text-xl font-bold">Agenda</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                </Button>
            </header>

            <div className="container mx-auto p-4 space-y-4">
                {/* Calendar Header */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg font-bold capitalize">
                            {format(currentMonth, "MMMM yyyy", { locale: es })}
                        </CardTitle>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                                <div key={day} className="text-[10px] font-bold text-slate-400 uppercase">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => {
                                const dayApts = getAppointmentsForDay(day);
                                const isCurrentMonth = isSameMonth(day, monthStart);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedDay(day);
                                            setIsDayModalOpen(true);
                                        }}
                                        className={`
                                            relative flex flex-col items-center justify-center rounded-lg p-2 h-14 transition-all
                                            ${isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 text-slate-300'}
                                            ${isToday ? 'ring-2 ring-primary ring-offset-1' : 'border'}
                                        `}
                                    >
                                        <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                                            {format(day, "d")}
                                        </span>
                                        {dayApts.length > 0 && (
                                            <Badge variant="secondary" className="mt-1 px-1 py-0 text-[10px] h-4 min-w-4 justify-center bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                +{dayApts.length}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Hoy</p>
                                <p className="text-lg font-bold">{getAppointmentsForDay(new Date()).length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <CalendarIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Pendientes</p>
                                <p className="text-lg font-bold">{appointments.filter(a => a.status === "PENDING").length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Day Details Modal */}
            <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {selectedDay && format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {dayAppointments.length === 0 ? (
                            <p className="text-center py-10 text-slate-500">No hay turnos para este día</p>
                        ) : (
                            dayAppointments.map((apt) => (
                                <Card key={apt.id} className="overflow-hidden border-l-4 border-l-primary">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 font-bold">
                                                <Clock className="h-4 w-4 text-slate-400" />
                                                {format(new Date(apt.date), "HH:mm")}
                                            </div>
                                            {getStatusBadge(apt.status)}
                                        </div>
                                        <div className="space-y-1 mb-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-3 w-3 text-slate-400" />
                                                {apt.client.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-3 w-3 text-slate-400" />
                                                {apt.client.phone}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                disabled={apt.status === "COMPLETED"}
                                                onClick={() => {
                                                    setSelectedAppointment(apt);
                                                    setIsPaymentModalOpen(true);
                                                }}
                                            >
                                                Completar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                                disabled={apt.status !== "PENDING"}
                                                onClick={() => handleStatusUpdate(apt.id, "CANCELLED")}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(apt.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Method Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Método de Pago</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-24 flex-col gap-2"
                                onClick={() => handleStatusUpdate(selectedAppointment.id, "COMPLETED", "CASH")}
                            >
                                <DollarSign className="h-8 w-8 text-green-600" />
                                Efectivo
                            </Button>
                            <Button
                                variant="outline"
                                className="h-24 flex-col gap-2"
                                onClick={() => handleStatusUpdate(selectedAppointment.id, "COMPLETED", "TRANSFER")}
                            >
                                <CreditCard className="h-8 w-8 text-blue-600" />
                                Transferencia
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bottom Navigation for Admin */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 px-4 shadow-lg">
                <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-primary" onClick={() => router.push("/admin/dashboard")}>
                    <CalendarIcon className="h-6 w-6" />
                    <span className="text-[10px]">Agenda</span>
                </Button>
                <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-slate-400" onClick={() => router.push("/admin/stats")}>
                    <DollarSign className="h-6 w-6" />
                    <span className="text-[10px]">Estadísticas</span>
                </Button>
                <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-slate-400" onClick={() => router.push("/admin/clients")}>
                    <User className="h-6 w-6" />
                    <span className="text-[10px]">Clientes</span>
                </Button>
            </nav>
            <Footer />
        </main>
    );
}
