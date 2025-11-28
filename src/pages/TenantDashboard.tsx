import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, LogOut, Menu, X, Car, Calendar, Wrench, Settings } from 'lucide-react';
import ClientsPage from './ClientsPage';
import VehiclesPage from './VehiclesPage';
import PlanningPage from './PlanningPage';
import ServicesPage from './ServicesPage';
import InterventionsPage from './InterventionsPage';
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
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'clients' | 'vehicles' | 'planning' | 'services' | 'interventions'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      if (tenantRes.data) setTenant(tenantRes.data);
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
              <div>
                <h1 className="text-xl font-bold">Apios Garage</h1>
                <p className="text-xs text-slate-300">{tenant?.name}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('planning')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'planning'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Planning
              </button>
              <button
                onClick={() => setCurrentPage('interventions')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'interventions'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Interventions
              </button>
              <button
                onClick={() => setCurrentPage('services')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'services'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setCurrentPage('clients')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'clients'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => setCurrentPage('vehicles')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'vehicles'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Véhicules
              </button>
              <span className="text-sm text-slate-300">{profile?.full_name}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <button
                onClick={() => {
                  setCurrentPage('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  currentPage === 'dashboard' ? 'bg-orange-500' : 'hover:bg-slate-800'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentPage('planning');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  currentPage === 'planning' ? 'bg-orange-500' : 'hover:bg-slate-800'
                }`}
              >
                Planning
              </button>
              <button
                onClick={() => {
                  setCurrentPage('interventions');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  currentPage === 'interventions' ? 'bg-orange-500' : 'hover:bg-slate-800'
                }`}
              >
                Interventions
              </button>
              <button
                onClick={() => {
                  setCurrentPage('services');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  currentPage === 'services' ? 'bg-orange-500' : 'hover:bg-slate-800'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => {
                  setCurrentPage('clients');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  currentPage === 'clients' ? 'bg-orange-500' : 'hover:bg-slate-800'
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => {
                  setCurrentPage('vehicles');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  currentPage === 'vehicles' ? 'bg-orange-500' : 'hover:bg-slate-800'
                }`}
              >
                Véhicules
              </button>
              <button
                onClick={() => signOut()}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-800"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </nav>

      {currentPage === 'interventions' ? (
        <InterventionsPage />
      ) : currentPage === 'services' ? (
        <ServicesPage />
      ) : currentPage === 'dashboard' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Bienvenue, {profile?.full_name}
            </h2>
            <p className="text-slate-600">Voici un aperçu de votre garage</p>
          </div>

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
        </main>
      ) : currentPage === 'planning' ? (
        <PlanningPage />
      ) : currentPage === 'clients' ? (
        <ClientsPage onBack={() => setCurrentPage('dashboard')} />
      ) : (
        <VehiclesPage />
      )}
    </div>
  );
}
