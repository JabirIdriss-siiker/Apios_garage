import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Users, Plus, Pencil, Trash2, Ban, CheckCircle, CreditCard, LayoutDashboard } from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { TenantModal, UserModal, SubscriptionModal } from '../../components/SuperAdminModals';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
type TenantSubscription = Database['public']['Tables']['tenant_subscriptions']['Row'];

export default function SuperAdminOverview() {
    const { profile } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTenantModal, setShowTenantModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [selectedTenantForSubscription, setSelectedTenantForSubscription] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tenantsRes, usersRes, subscriptionsRes, plansRes] = await Promise.all([
                supabase.from('tenants').select('*').order('created_at', { ascending: false }),
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('tenant_subscriptions').select('*'),
                supabase.from('subscription_plans').select('*').order('price_monthly')
            ]);

            if (tenantsRes.data) setTenants(tenantsRes.data);
            if (usersRes.data) setUsers(usersRes.data);
            if (subscriptionsRes.data) setSubscriptions(subscriptionsRes.data);
            if (plansRes.data) setPlans(plansRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTenant = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce garage ?')) return;

        try {
            const { error } = await supabase.from('tenants').delete().eq('id', id);
            if (error) throw error;
            await loadData();
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    };

    const handleToggleSuspension = async (tenant: Tenant) => {
        const isSuspended = tenant.subscription_status === 'suspended';
        const newStatus = isSuspended ? 'active' : 'suspended';

        try {
            const { error } = await supabase
                .from('tenants')
                .update({
                    subscription_status: newStatus,
                    suspended_at: isSuspended ? null : new Date().toISOString(),
                    suspension_reason: isSuspended ? null : 'Suspendu par administrateur',
                })
                .eq('id', tenant.id);

            if (error) throw error;
            await loadData();
        } catch (error) {
            alert('Erreur lors de la modification du statut');
        }
    };

    const getTenantSubscription = (tenantId: string) => {
        return subscriptions.find(s => s.tenant_id === tenantId);
    };

    const getPlanName = (planId: string) => {
        return plans.find(p => p.id === planId)?.name || 'Aucun';
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
            {/* Welcome & Quick Actions Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Super Admin Dashboard</h2>
                        <p className="text-slate-300">Bienvenue, {profile?.full_name}. Gérez l'ensemble de la plateforme ici.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                setEditingTenant(null);
                                setShowTenantModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-medium transition-all shadow-lg hover:shadow-orange-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            Nouveau Garage
                        </button>
                        <button
                            onClick={() => setShowUserModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl font-medium transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Nouvel Utilisateur
                        </button>
                    </div>
                </div>

                {/* KPI Cards embedded in hero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-300">Total Garages</p>
                            <Building2 className="w-6 h-6 text-orange-400" />
                        </div>
                        <p className="text-3xl font-bold">{tenants.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-300">Total Utilisateurs</p>
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold">{users.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-300">Abonnements Actifs</p>
                            <CreditCard className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-3xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</p>
                    </div>
                </div>
            </div>

            {/* Garages Table */}
            <div className="bg-white rounded-lg shadow border border-slate-100">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        Liste des Garages
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {tenants.map((tenant) => {
                                const subscription = getTenantSubscription(tenant.id);
                                const isSuspended = tenant.subscription_status === 'suspended';
                                return (
                                    <tr key={tenant.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{tenant.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{tenant.email || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {subscription ? getPlanName(subscription.plan_id) : 'Aucun'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {isSuspended ? 'Suspendu' : 'Actif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTenantForSubscription(tenant.id);
                                                        setShowSubscriptionModal(true);
                                                    }}
                                                    className="p-2 text-slate-600 hover:bg-slate-50 rounded"
                                                    title="Gérer l'abonnement"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleSuspension(tenant)}
                                                    className={`p-2 rounded ${isSuspended ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'
                                                        }`}
                                                    title={isSuspended ? 'Activer' : 'Suspendre'}
                                                >
                                                    {isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingTenant(tenant);
                                                        setShowTenantModal(true);
                                                    }}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTenant(tenant.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow border border-slate-100">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        Liste des Utilisateurs
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Garage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Téléphone</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map((user) => {
                                const tenant = tenants.find((t) => t.id === user.tenant_id);
                                return (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.full_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{tenant?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showTenantModal && (
                <TenantModal
                    tenant={editingTenant}
                    onClose={() => {
                        setShowTenantModal(false);
                        setEditingTenant(null);
                    }}
                    onSuccess={() => {
                        setShowTenantModal(false);
                        setEditingTenant(null);
                        loadData();
                    }}
                />
            )}

            {showUserModal && (
                <UserModal
                    tenants={tenants}
                    onClose={() => setShowUserModal(false)}
                    onSuccess={() => {
                        setShowUserModal(false);
                        loadData();
                    }}
                />
            )}

            {showSubscriptionModal && selectedTenantForSubscription && (
                <SubscriptionModal
                    tenantId={selectedTenantForSubscription}
                    plans={plans}
                    currentSubscription={getTenantSubscription(selectedTenantForSubscription)}
                    onClose={() => {
                        setShowSubscriptionModal(false);
                        setSelectedTenantForSubscription(null);
                    }}
                    onSuccess={() => {
                        setShowSubscriptionModal(false);
                        setSelectedTenantForSubscription(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
