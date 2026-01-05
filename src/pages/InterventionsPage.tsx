import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Wrench, ChevronLeft, ChevronRight, Eye, Edit2, Trash2 } from 'lucide-react';
import InterventionModal from '../components/InterventionModal';
import InterventionDetailsModal from '../components/InterventionDetailsModal';
import { DeleteConfirmModal } from '../components/InterventionDeleteModal';
import type { Database } from '../lib/database.types';

type Intervention = Database['public']['Tables']['interventions']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const ITEMS_PER_PAGE = 10;

export default function InterventionsPage() {
  const { profile } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mechanics, setMechanics] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [deletingIntervention, setDeletingIntervention] = useState<Intervention | null>(null);

  const canManage = profile?.role === 'TENANT_ADMIN' || profile?.role === 'RECEPTION';

  useEffect(() => {
    loadData();
  }, [profile?.tenant_id]);

  useEffect(() => {
    filterAndPaginateInterventions();
  }, [searchTerm, statusFilter, interventions, currentPage]);

  const loadData = async () => {
    if (!profile?.tenant_id) return;

    setLoading(true);
    try {
      const [interventionsRes, clientsRes, vehiclesRes, mechanicsRes] = await Promise.all([
        supabase
          .from('interventions')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .order('name'),
        supabase
          .from('vehicles')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .order('license_plate'),
        supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('role', 'MECHANIC')
          .order('full_name')
      ]);

      if (interventionsRes.data) setInterventions(interventionsRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (mechanicsRes.data) setMechanics(mechanicsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndPaginateInterventions = () => {
    let filtered = interventions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(intervention => {
        const client = clients.find(c => c.id === intervention.client_id);
        const vehicle = vehicles.find(v => v.id === intervention.vehicle_id);
        const mechanic = mechanics.find(m => m.id === intervention.mechanic_id);

        return (
          client?.name.toLowerCase().includes(term) ||
          vehicle?.license_plate.toLowerCase().includes(term) ||
          vehicle?.make.toLowerCase().includes(term) ||
          vehicle?.model.toLowerCase().includes(term) ||
          mechanic?.full_name.toLowerCase().includes(term) ||
          intervention.description.toLowerCase().includes(term)
        );
      });
    }

    setFilteredInterventions(filtered);
  };

  const paginatedInterventions = filteredInterventions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredInterventions.length / ITEMS_PER_PAGE);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Client inconnu';
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return 'Véhicule inconnu';
    return `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`;
  };

  const getMechanicName = (mechanicId: string | null) => {
    if (!mechanicId) return 'Non assigné';
    return mechanics.find(m => m.id === mechanicId)?.full_name || 'Mécanicien inconnu';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      default:
        return status;
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Gestion des Interventions</h2>
            </div>
            {canManage && (
              <button
                onClick={() => {
                  setSelectedIntervention(null);
                  setShowModal(true);
                }}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nouvelle Intervention</span>
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par client, véhicule, mécanicien..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminées</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredInterventions.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Aucune intervention trouvée pour cette recherche'
                  : 'Aucune intervention enregistrée pour le moment'}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Mécanicien
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Coût Estimé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Coût Réel
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedInterventions.map((intervention) => (
                    <tr key={intervention.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {getClientName(intervention.client_id)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                          {intervention.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getVehicleInfo(intervention.vehicle_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getMechanicName(intervention.mechanic_id)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                            intervention.status
                          )}`}
                        >
                          {getStatusLabel(intervention.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {intervention.estimated_cost.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {intervention.actual_cost.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedIntervention(intervention);
                              setShowDetailsModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedIntervention(intervention);
                                  setShowModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingIntervention(intervention)}
                                className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredInterventions.length)} sur{' '}
                    {filteredInterventions.length} interventions
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <InterventionModal
          tenantId={profile?.tenant_id!}
          intervention={selectedIntervention}
          clients={clients}
          vehicles={vehicles}
          mechanics={mechanics}
          onClose={() => {
            setShowModal(false);
            setSelectedIntervention(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedIntervention(null);
            loadData();
          }}
        />
      )}

      {showDetailsModal && selectedIntervention && (
        <InterventionDetailsModal
          intervention={selectedIntervention}
          tenantId={profile?.tenant_id!}
          clients={clients}
          vehicles={vehicles}
          mechanics={mechanics}
          canEdit={canManage || profile?.role === 'MECHANIC'}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedIntervention(null);
          }}
          onUpdate={() => {
            loadData();
          }}
        />
      )}

      {deletingIntervention && (
        <DeleteConfirmModal
          interventionDescription={deletingIntervention.description}
          onConfirm={async () => {
            try {
              const { error } = await supabase
                .from('interventions')
                .delete()
                .eq('id', deletingIntervention.id);

              if (error) throw error;
              setDeletingIntervention(null);
              loadData();
            } catch (error) {
              alert('Erreur lors de la suppression de l\'intervention');
              console.error(error);
            }
          }}
          onCancel={() => setDeletingIntervention(null)}
        />
      )}
    </main>
  );
}
