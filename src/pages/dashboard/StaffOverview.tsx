import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Users, Car, Calendar, Wrench } from 'lucide-react';

interface StaffOverviewProps {
    onNavigate: (page: string) => void;
}

export default function StaffOverview({ onNavigate }: StaffOverviewProps) {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        myInterventions: 0,
        todayAppointments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [profile?.id]);

    const loadData = async () => {
        if (!profile?.tenant_id) return;

        try {
            // Load user specific stats
            const { count: myInterventions } = await supabase
                .from('interventions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'in_progress')
                .eq('mechanic_id', profile.id);

            setStats({
                myInterventions: myInterventions || 0,
                todayAppointments: 0 // Placeholder
            });

        } catch (error) {
            console.error('Error loading staff data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Tableau de bord</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div
                    onClick={() => onNavigate('interventions')}
                    className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Mes Interventions en cours</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.myInterventions}</p>
                        </div>
                        <Wrench className="w-12 h-12 text-blue-500" />
                    </div>
                </div>

                <div
                    onClick={() => onNavigate('planning')}
                    className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Rendez-vous aujourd'hui</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.todayAppointments}</p>
                        </div>
                        <Calendar className="w-12 h-12 text-green-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
