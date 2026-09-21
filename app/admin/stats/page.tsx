"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  UserX,
  Clock,
  Sparkles,
  ArrowUpRight,
  Wallet,
  PieChart as PieChartIcon,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import { getAdminStats, DashboardStats } from "../actions";
import { formatPrice } from "@/lib/services";

export default function StatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate =
    stats && stats.total > 0
      ? Math.round(((stats.completed + stats.confirmed) / stats.total) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-transparent text-charcoal flex flex-col pb-16">
      <AdminNavbar />

      <div className="container mx-auto px-4 max-w-5xl py-8 space-y-8">
        {/* Header con estilo Ágape */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sand pb-6">
          <div>
            <div className="flex items-center gap-2 text-gold-accent text-xs font-semibold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              Métricas & Rendimiento
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-charcoal">
              Estadísticas del Estudio
            </h1>
            <p className="text-xs text-charcoal/60 mt-1">
              Seguimiento de ingresos, nivel de asistencia y servicios más solicitados.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="border-sand text-charcoal hover:bg-white self-start md:self-auto gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar Datos
          </Button>
        </div>

        {loading || !stats ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-gold-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-charcoal/60 font-medium">
              Calculando métricas de ÁGAPE STUDIO...
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Tarjetas de Ingresos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Facturación Realizada */}
              <Card className="bg-white border-sand shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider">
                      Facturación Cobrada
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-700 font-serif">
                    {formatPrice(stats.totalRevenue)}
                  </div>
                  <p className="text-xs text-charcoal/60 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    Turnos completados finalizados
                  </p>
                </CardContent>
              </Card>

              {/* Facturación Estimada */}
              <Card className="bg-white border-sand shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gold-accent" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider">
                      Facturación Pendiente
                    </span>
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-gold-accent flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-charcoal font-serif">
                    {formatPrice(stats.pendingRevenue)}
                  </div>
                  <p className="text-xs text-charcoal/60 mt-1.5 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-gold-accent inline" />
                    Por cobrar en turnos confirmados
                  </p>
                </CardContent>
              </Card>

              {/* Tasa de Asistencia / Éxito */}
              <Card className="bg-white border-sand shadow-sm hover:shadow-md transition-shadow relative overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="absolute top-0 left-0 right-0 h-1 bg-charcoal" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider">
                      Efectividad de Agenda
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-charcoal flex items-center justify-center">
                      <PieChartIcon className="w-4 h-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-charcoal font-serif">
                    {attendanceRate}%
                  </div>
                  <p className="text-xs text-charcoal/60 mt-1.5">
                    Tasa de asistencia positiva sobre el total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Desglose de Estado de Turnos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-sand rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-charcoal font-serif">
                  {stats.total}
                </div>
                <div className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold mt-1">
                  Total Registrados
                </div>
              </div>

              <div className="bg-white border border-sand rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600 font-serif">
                  {stats.completed}
                </div>
                <div className="text-xs text-emerald-700 uppercase tracking-wider font-semibold mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completados
                </div>
              </div>

              <div className="bg-white border border-sand rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-rose-600 font-serif">
                  {stats.cancelled}
                </div>
                <div className="text-xs text-rose-700 uppercase tracking-wider font-semibold mt-1 flex items-center justify-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Cancelados
                </div>
              </div>

              <div className="bg-white border border-sand rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-500 font-serif">
                  {stats.noShow}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wider font-semibold mt-1 flex items-center justify-center gap-1">
                  <UserX className="w-3.5 h-3.5" /> Ausencias
                </div>
              </div>
            </div>

            {/* Servicios Más Solicitados */}
            <Card className="bg-white border-sand shadow-sm">
              <CardHeader className="border-b border-sand/60 pb-4">
                <CardTitle className="text-lg font-serif font-bold text-charcoal flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-accent" />
                  Servicios Más Solicitados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!stats.popularServices || stats.popularServices.length === 0 ? (
                  <div className="text-center py-8 text-charcoal/50 text-sm">
                    No hay suficientes datos de servicios aún.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.popularServices.map((srv, idx) => {
                      const percentage =
                        stats.total > 0
                          ? Math.round((srv.count / stats.total) * 100)
                          : 0;
                      return (
                        <div key={srv.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-charcoal flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-sand/60 text-xs font-bold flex items-center justify-center text-charcoal/70">
                                {idx + 1}
                              </span>
                              {srv.name}
                            </span>
                            <span className="text-xs text-charcoal/70">
                              <strong className="text-charcoal font-semibold">
                                {srv.count} {srv.count === 1 ? "turno" : "turnos"}
                              </strong>{" "}
                              ({percentage}%) · {formatPrice(srv.revenue)}
                            </span>
                          </div>
                          <div className="w-full bg-sand/40 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gold-accent h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Banner Motivacional Ágape */}
            <div className="p-6 bg-gradient-to-r from-sand/50 via-warm-beige to-sand/40 rounded-2xl border border-sand/80 text-center space-y-1">
              <h3 className="font-serif font-bold text-charcoal text-base">
                ÁGAPE STUDIO
              </h3>
              <p className="text-xs text-charcoal/70">
                Excelencia, dedicación y cuidado en cada detalle.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
