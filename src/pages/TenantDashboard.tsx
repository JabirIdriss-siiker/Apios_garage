import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, LogOut, Menu, X, Car, Calendar, Wrench, Settings, FileText, User } from 'lucide-react';
import ClientsPage from './ClientsPage';
import VehiclesPage from './VehiclesPage';
import PlanningPage from './PlanningPage';
import ServicesPage from './ServicesPage';
import InterventionsPage from './InterventionsPage';
import FacturationPage from './FacturationPage';
import ProfileSettings from './ProfileSettings';
import OnboardingWizard from './OnboardingWizard';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export default function TenantDashboard() {
  const { signOut, profile } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'clients' | 'vehicles' | 'planning' | 'services' | 'interventions' | 'facturation' | 'profile'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile?.tenant_id]);

  const loadData = async () => {
    if (!profile?.tenant_id) return;

    setLoading(true);
    try {
      const [tenantRes, clientsRes, vehiclesRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', profile.tenant_id).maybeSingle(),
        supabase.from('clients').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false })
      ]);

      if (tenantRes.data) {
        setTenant(tenantRes.data);
        // Check if onboarding is needed for tenant admin
        if (profile.role === 'TENANT_ADMIN' && !tenantRes.data.onboarding_completed) {
          setShowOnboarding(true);
        }
      }
      if (clientsRes.data) {
        setClients(clientsRes.data);
        setRecentClients(clientsRes.data.slice(0, 5));
      }
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'interventions', label: 'Interventions', icon: Wrench },
    { id: 'services', label: 'Services', icon: Settings },
    { id: 'facturation', label: 'Facturation', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'vehicles', label: 'Véhicules', icon: Car },
    { id: 'profile', label: 'Mon Profil', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show onboarding wizard for first-time tenant admin login
  if (showOnboarding) {
    return (
      <OnboardingWizard
        onComplete={async () => {
          console.log('Onboarding complete callback triggered');
          try {
            // Mark onboarding as completed
            if (tenant?.id) {
              console.log('Updating tenant onboarding_completed flag...');
              const { error } = await supabase
                .from('tenants')
                .update({ onboarding_completed: true })
                .eq('id', tenant.id);

              if (error) {
                console.error('Error updating onboarding_completed:', error);
                throw error;
              }
              console.log('Onboarding marked as completed successfully');
            }

            // Hide wizard and reload data
            console.log('Hiding onboarding wizard...');
            setShowOnboarding(false);

            // Reload tenant data to get updated onboarding_completed flag
            console.log('Reloading dashboard data...');
            await loadData();
            console.log('Dashboard data reloaded');
          } catch (error) {
            console.error('Error in onboarding completion:', error);
            // Even if there's an error, try to hide the wizard
            setShowOnboarding(false);
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl`}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-sm font-bold truncate">Apios Garage</h1>
                  <p className="text-xs text-slate-400 truncate">{tenant?.name}</p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-500 p-2 rounded-lg mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as any)}
                className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'px-0 justify-center'
                  } py-3 rounded-lg transition-all ${isActive
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          {sidebarOpen && (
            <div className="px-4 py-2 mb-2">
              <p className="text-xs text-slate-400 mb-1">Connecté en tant que</p>
              <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{profile?.role}</p>
            </div>
          )}

          <button
            onClick={() => signOut()}
            className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'px-0 justify-center'
              } py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all`}
            title={!sidebarOpen ? 'Déconnexion' : undefined}
          >
            <LogOut className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
            {sidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'px-0 justify-center'
              } py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all`}
            title={sidebarOpen ? 'Réduire' : 'Agrandir'}
          >
            <Menu className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
            {sidebarOpen && <span className="text-sm font-medium">Réduire</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {currentPage === 'dashboard' && `Bienvenue, ${profile?.full_name}`}
                {currentPage === 'planning' && 'Gérez vos rendez-vous'}
                {currentPage === 'interventions' && 'Suivez vos interventions'}
                {currentPage === 'services' && 'Gérez vos services'}
                {currentPage === 'clients' && 'Gérez vos clients'}
                {currentPage === 'vehicles' && 'Gérez vos véhicules'}
                {currentPage === 'facturation' && 'Gérez vos factures et devis'}
                {currentPage === 'profile' && 'Gérez votre profil'}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {currentPage === 'interventions' ? (
            <InterventionsPage />
          ) : currentPage === 'services' ? (
            <ServicesPage />
          ) : currentPage === 'facturation' ? (
            <FacturationPage />
          ) : currentPage === 'dashboard' ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Clients</p>
                      <p className="text-3xl font-bold text-slate-900">{clients.length}</p>
                    </div>
                    <Users className="w-12 h-12 text-orange-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Véhicules</p>
                      <p className="text-3xl font-bold text-slate-900">{vehicles.length}</p>
                    </div>
                    <Car className="w-12 h-12 text-orange-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Interventions</p>
                      <p className="text-3xl font-bold text-slate-900">0</p>
                    </div>
                    <Building2 className="w-12 h-12 text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">Clients récents</h3>
                </div>
                <div className="p-6">
                  {recentClients.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">
                      Aucun client enregistré pour le moment
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {recentClients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{client.name}</p>
                            <p className="text-sm text-slate-600">{client.email || client.phone || 'Pas de contact'}</p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(client.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : currentPage === 'planning' ? (
            <PlanningPage />
          ) : currentPage === 'clients' ? (
            <ClientsPage onBack={() => setCurrentPage('dashboard')} />
          ) : currentPage === 'profile' ? (
            <ProfileSettings />
          ) : (
            <VehiclesPage />
          )}
        </main>
      </div>
    </div>
  );
}
