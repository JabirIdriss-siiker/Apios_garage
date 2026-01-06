import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { User, CreditCard, Building2, Check, X } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import LimitGauge from '../components/LimitGauge';
import type { Database } from '../lib/database.types';

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];

export default function SettingsPage() {
    const { profile } = useAuth();
    const subscription = useSubscription();
    const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'garage'>('profile');
    const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [profile?.tenant_id]);

    const loadData = async () => {
        if (!profile?.tenant_id) return;

        try {
            const [plansRes, tenantRes] = await Promise.all([
                supabase.from('subscription_plans').select('*').eq('is_active', true).order('price_monthly'),
                supabase.from('tenants').select('*').eq('id', profile.tenant_id).single(),
            ]);

            if (plansRes.data) setAllPlans(plansRes.data);
            if (tenantRes.data) setTenant(tenantRes.data);
        } catch (error) {
            console.error('Error loading settings data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePlan = async (planId: string) => {
        if (!profile?.tenant_id) {
            alert('Erreur: Tenant ID non trouvé');
            return;
        }

        if (!confirm('Voulez-vous vraiment changer de plan ?')) return;

        console.log('Changing plan to:', planId);
        console.log('Current subscription:', subscription.subscription);

        try {
            // Check if subscription exists
            if (subscription.subscription) {
                console.log('Updating existing subscription:', subscription.subscription.id);
                // Update existing subscription
                const { data, error } = await supabase
                    .from('tenant_subscriptions')
                    .update({
                        plan_id: planId,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', subscription.subscription.id)
                    .select();

                console.log('Update result:', { data, error });
                if (error) throw error;
            } else {
                console.log('Creating new subscription for tenant:', profile.tenant_id);
                // Create new subscription
                const { data, error } = await supabase.from('tenant_subscriptions').insert({
                    tenant_id: profile.tenant_id,
                    plan_id: planId,
                    status: 'active',
                    started_at: new Date().toISOString(),
                }).select();

                console.log('Insert result:', { data, error });
                if (error) throw error;
            }

            alert('Plan mis à jour avec succès!');
            window.location.reload();
        } catch (error) {
            console.error('Error changing plan:', error);
            alert(`Erreur lors du changement de plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Mon Profil', icon: User },
        { id: 'subscription', label: 'Abonnement', icon: CreditCard },
        { id: 'garage', label: 'Mon Garage', icon: Building2 },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow">
                {/* Tabs Header */}
                <div className="border-b border-slate-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'profile' && <ProfileSettings />}

                    {activeTab === 'subscription' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestion de l'Abonnement</h2>
                                <p className="text-slate-600">Gérez votre plan et consultez votre utilisation</p>
                            </div>

                            {/* Current Plan */}
                            {subscription.plan && (
                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-slate-600 mb-1">Plan Actuel</p>
                                            <h3 className="text-2xl font-bold text-slate-900">{subscription.plan.name}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-orange-600">{subscription.plan.price_monthly}€</p>
                                            <p className="text-sm text-slate-600">par mois</p>
                                        </div>
                                    </div>

                                    {/* Usage Gauges */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        <LimitGauge
                                            label="Utilisateurs"
                                            used={subscription.limits.users.used}
                                            max={subscription.limits.users.max}
                                        />
                                        <LimitGauge
                                            label="Véhicules"
                                            used={subscription.limits.vehicles.used}
                                            max={subscription.limits.vehicles.max}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Available Plans */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Plans Disponibles</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {allPlans.map((plan) => {
                                        const isCurrentPlan = subscription.plan?.id === plan.id;
                                        const features = (plan.features as any) || {};

                                        return (
                                            <div
                                                key={plan.id}
                                                className={`border-2 rounded-xl p-6 transition-all ${isCurrentPlan
                                                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                                                    }`}
                                            >
                                                {isCurrentPlan && (
                                                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full mb-4">
                                                        <Check className="w-3 h-3" />
                                                        Plan Actuel
                                                    </div>
                                                )}

                                                <h4 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h4>
                                                <div className="mb-4">
                                                    <span className="text-3xl font-bold text-slate-900">{plan.price_monthly}€</span>
                                                    <span className="text-slate-600">/mois</span>
                                                </div>

                                                <ul className="space-y-3 mb-6">
                                                    <li className="flex items-center gap-2 text-sm text-slate-700">
                                                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        <span>{plan.max_users} utilisateurs</span>
                                                    </li>
                                                    <li className="flex items-center gap-2 text-sm text-slate-700">
                                                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        <span>{plan.max_vehicles} véhicules</span>
                                                    </li>
                                                    <li className="flex items-center gap-2 text-sm text-slate-700">
                                                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        <span>{plan.max_storage_gb} GB stockage</span>
                                                    </li>
                                                    <li className="flex items-center gap-2 text-sm text-slate-700">
                                                        {features.advanced_reports ? (
                                                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        ) : (
                                                            <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                        )}
                                                        <span className={features.advanced_reports ? '' : 'text-slate-400'}>
                                                            Rapports avancés
                                                        </span>
                                                    </li>
                                                    <li className="flex items-center gap-2 text-sm text-slate-700">
                                                        {features.api_access ? (
                                                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        ) : (
                                                            <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                        )}
                                                        <span className={features.api_access ? '' : 'text-slate-400'}>Accès API</span>
                                                    </li>
                                                    <li className="flex items-center gap-2 text-sm text-slate-700">
                                                        {features.custom_branding ? (
                                                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        ) : (
                                                            <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                        )}
                                                        <span className={features.custom_branding ? '' : 'text-slate-400'}>
                                                            Personnalisation
                                                        </span>
                                                    </li>
                                                </ul>

                                                <button
                                                    onClick={() => handleChangePlan(plan.id)}
                                                    disabled={isCurrentPlan || loading}
                                                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${isCurrentPlan
                                                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                                        }`}
                                                >
                                                    {isCurrentPlan ? 'Plan Actuel' : 'Choisir ce plan'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'garage' && tenant && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Informations du Garage</h2>
                                <p className="text-slate-600">Consultez les informations de votre garage</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du garage</label>
                                    <p className="text-lg font-semibold text-slate-900">{tenant.name}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <p className="text-lg text-slate-900">{tenant.email || 'Non renseigné'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                                    <p className="text-lg text-slate-900">{tenant.phone || 'Non renseigné'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                                    <p className="text-lg text-slate-900">{tenant.address || 'Non renseignée'}</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Lien de réservation public</label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-900">
                                            {window.location.origin}/booking/{tenant.slug}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/booking/${tenant.slug}`);
                                                alert('Lien copié!');
                                            }}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                        >
                                            Copier
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
