import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, Plus, LogOut, Pencil, Trash2, Ban, CheckCircle, CreditCard } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
type TenantSubscription = Database['public']['Tables']['tenant_subscriptions']['Row'];

export default function SuperAdminDashboard() {
  const { signOut, profile } = useAuth();
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-orange-500 mr-3" />
              <h1 className="text-xl font-bold">Apios Garage - Super Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-300">{profile?.full_name}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Garages</p>
                <p className="text-3xl font-bold text-slate-900">{tenants.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Utilisateurs</p>
                <p className="text-3xl font-bold text-slate-900">{users.length}</p>
              </div>
              <Users className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Garages</h2>
              <button
                onClick={() => {
                  setEditingTenant(null);
                  setShowTenantModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau Garage</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {tenants.map((tenant) => {
                  const subscription = getTenantSubscription(tenant.id);
                  const isSuspended = tenant.subscription_status === 'suspended';
                  return (
                    <tr key={tenant.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {tenant.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{tenant.email || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {subscription ? getPlanName(subscription.plan_id) : 'Aucun'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isSuspended
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
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
                            className={`p-2 rounded ${
                              isSuspended
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-orange-600 hover:bg-orange-50'
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
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
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

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Utilisateurs</h2>
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nouvel Utilisateur</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Garage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user) => {
                  const tenant = tenants.find((t) => t.id === user.tenant_id);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {tenant?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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

function TenantModal({
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

function UserModal({
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

function SubscriptionModal({
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
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedPlanId === plan.id
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
