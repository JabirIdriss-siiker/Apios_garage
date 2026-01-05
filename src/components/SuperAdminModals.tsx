import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
type TenantSubscription = Database['public']['Tables']['tenant_subscriptions']['Row'];

export function TenantModal({
    tenant,
    onClose,
    onSuccess,
}: {
    tenant: Tenant | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: tenant?.name || '',
        email: tenant?.email || '',
        phone: tenant?.phone || '',
        address: tenant?.address || '',
        slug: tenant?.slug || '',
    });
    const [loading, setLoading] = useState(false);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (tenant) {
                const { error } = await supabase
                    .from('tenants')
                    .update({ ...formData, updated_at: new Date().toISOString() })
                    .eq('id', tenant.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('tenants').insert(formData);
                if (error) throw error;
            }
            onSuccess();
        } catch (error) {
            alert('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {tenant ? 'Modifier le garage' : 'Nouveau garage'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Slug pour réservation publique {tenant ? '' : '*'}
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            onBlur={(e) => {
                                if (!tenant && !e.target.value && formData.name) {
                                    setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
                                }
                            }}
                            required={!tenant}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="garage-dupont"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            URL publique: {window.location.origin}/booking/{formData.slug || 'slug-du-garage'}
                        </p>
                    </div>
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function UserModal({
    tenants,
    onClose,
    onSuccess,
}: {
    tenants: Tenant[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'TENANT_ADMIN' as Profile['role'],
        tenant_id: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await signUp(
                formData.email,
                formData.password,
                formData.full_name,
                formData.role,
                formData.tenant_id || undefined
            );
            onSuccess();
        } catch (error) {
            alert('Erreur lors de la création');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Nouvel utilisateur</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rôle *</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Profile['role'] })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="TENANT_ADMIN">Admin Garage</option>
                            <option value="RECEPTION">Réception</option>
                            <option value="MECHANIC">Mécanicien</option>
                            <option value="ACCOUNTANT">Comptable</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Garage *</label>
                        <select
                            value={formData.tenant_id}
                            onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Sélectionner un garage</option>
                            {tenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                        >
                            {loading ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function SubscriptionModal({
    tenantId,
    plans,
    currentSubscription,
    onClose,
    onSuccess,
}: {
    tenantId: string;
    plans: SubscriptionPlan[];
    currentSubscription: TenantSubscription | undefined;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedPlanId, setSelectedPlanId] = useState(currentSubscription?.plan_id || '');
    const [expiresAt, setExpiresAt] = useState(
        currentSubscription?.expires_at
            ? new Date(currentSubscription.expires_at).toISOString().split('T')[0]
            : ''
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const subscriptionData = {
                tenant_id: tenantId,
                plan_id: selectedPlanId,
                status: 'active',
                expires_at: expiresAt || null,
                updated_at: new Date().toISOString(),
            };

            if (currentSubscription) {
                const { error } = await supabase
                    .from('tenant_subscriptions')
                    .update(subscriptionData)
                    .eq('id', currentSubscription.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('tenant_subscriptions')
                    .insert({ ...subscriptionData, started_at: new Date().toISOString() });
                if (error) throw error;
            }

            onSuccess();
        } catch (error) {
            alert('Erreur lors de la sauvegarde de l\'abonnement');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Gérer l'abonnement
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Sélectionner un plan *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${selectedPlanId === plan.id
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <h4 className="font-bold text-lg text-slate-900 mb-2">{plan.name}</h4>
                                    <p className="text-2xl font-bold text-orange-600 mb-3">
                                        {plan.price_monthly} €<span className="text-sm text-slate-600">/mois</span>
                                    </p>
                                    <ul className="space-y-1 text-sm text-slate-600">
                                        <li>{plan.max_users} utilisateurs max</li>
                                        <li>{plan.max_vehicles} véhicules max</li>
                                        <li>{plan.max_storage_gb} GB stockage</li>
                                    </ul>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Date d'expiration
                        </label>
                        <input
                            type="date"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Laissez vide pour un abonnement sans limite de temps
                        </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedPlanId}
                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
