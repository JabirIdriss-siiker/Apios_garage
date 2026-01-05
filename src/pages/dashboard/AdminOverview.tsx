import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import {
    Building2, Users, Car, Wrench, FileText, Plus,
    TrendingUp, Clock, AlertCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Intervention = Database['public']['Tables']['interventions']['Row'];

interface AdminOverviewProps {
    onNavigate: (page: string) => void;
}

export default function AdminOverview({ onNavigate }: AdminOverviewProps) {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        clientsCount: 0,
        vehiclesCount: 0,
        activeInterventions: 0,
        pendingInvoices: 0
    });
    const [recentInterventions, setRecentInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [profile?.tenant_id]);

    const loadDashboardData = async () => {
        if (!profile?.tenant_id) return;

        try {
            const [
                { count: clientsCount },
                { count: vehiclesCount },
                { count: activeInterventions },
                { data: recent }
            ] = await Promise.all([
                supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id),
                supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id),
                supabase.from('interventions').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id).eq('status', 'in_progress'),
                supabase
                    .from('interventions')
                    .select('*')
                    .eq('tenant_id', profile.tenant_id)
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

            setStats({
                clientsCount: clientsCount || 0,
                vehiclesCount: vehiclesCount || 0,
                activeInterventions: activeInterventions || 0,
                pendingInvoices: 0 // Placeholder
            });

            if (recent) setRecentInterventions(recent);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg">
                <h2 className="text-3xl font-bold mb-2">Bonjour, {profile?.full_name} 👋</h2>
                <p className="text-slate-300">Voici ce qui se passe dans votre garage aujourd'hui.</p>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <button
                        onClick={() => onNavigate('interventions')}
                        className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all group"
                    >
                        <div className="p-3 bg-orange-500 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-medium">Nouvelle Intervention</span>
                    </button>

                    <button
                        onClick={() => onNavigate('clients')}
                        className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all group"
                    >
                        <div className="p-3 bg-blue-500 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-medium">Nouveau Client</span>
                    </button>

                    <button
                        onClick={() => onNavigate('vehicles')}
                        className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all group"
                    >
                        <div className="p-3 bg-green-500 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <Car className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-medium">Nouveau Véhicule</span>
                    </button>

                    <button
                        onClick={() => onNavigate('facturation')}
                        className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all group"
                    >
                        <div className="p-3 bg-purple-500 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-medium">Nouveau Devis</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Interventions en cours</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.activeInterventions}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-full">
                        <Wrench className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Clients Total</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.clientsCount}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-full">
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Véhicules Total</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.vehiclesCount}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-full">
                        <Car className="w-8 h-8 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Interventions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-400" />
                            Activités Récentes
                        </h3>
                        <button
                            onClick={() => onNavigate('interventions')}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                        >
                            Voir tout <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentInterventions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                Aucune activité récente
                            </div>
                        ) : (
                            recentInterventions.map((intervention) => (
                                <div key={intervention.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`
                      text-xs font-semibold px-2 py-0.5 rounded-full
                      ${intervention.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                intervention.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'}
                    `}>
                                            {intervention.status === 'completed' ? 'Terminé' :
                                                intervention.status === 'in_progress' ? 'En cours' : 'En attente'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(intervention.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="font-medium text-slate-900">{intervention.description}</p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Coût estimé: {intervention.estimated_cost}€
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Notifications / Alerts (Placeholder) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-slate-400" />
                            Notifications
                        </h3>
                    </div>
                    <div className="p-8 text-center text-slate-500">
                        <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                        </div>
                        <p>Aucune notification urgente.</p>
                        <p className="text-sm mt-2">Tout semble fonctionner correctement !</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
