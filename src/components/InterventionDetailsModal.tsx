import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  X,
  Plus,
  Trash2,
  User,
  Car,
  Calendar,
  DollarSign,
  FileText,
  Package,
  Image as ImageIcon,
  Edit,
  Clock,
  CheckCircle,
  Lock,
} from 'lucide-react';
import type { Database } from '../lib/database.types';

type Intervention = Database['public']['Tables']['interventions']['Row'];
type InterventionPart = Database['public']['Tables']['intervention_parts']['Row'];
type InterventionPhoto = Database['public']['Tables']['intervention_photos']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface InterventionDetailsModalProps {
  intervention: Intervention;
  tenantId: string;
  clients: Client[];
  vehicles: Vehicle[];
  mechanics: Profile[];
  canEdit: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function InterventionDetailsModal({
  intervention,
  tenantId,
  clients,
  vehicles,
  mechanics,
  canEdit,
  onClose,
  onUpdate,
}: InterventionDetailsModalProps) {
  const [parts, setParts] = useState<InterventionPart[]>([]);
  const [photos, setPhotos] = useState<InterventionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState<InterventionPart | null>(null);

  const isCompleted = intervention.status === 'completed';
  const isLocked = isCompleted;

  useEffect(() => {
    loadDetails();
  }, [intervention.id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const [partsRes, photosRes] = await Promise.all([
        supabase
          .from('intervention_parts')
          .select('*')
          .eq('intervention_id', intervention.id)
          .order('created_at'),
        supabase
          .from('intervention_photos')
          .select('*')
          .eq('intervention_id', intervention.id)
          .order('created_at'),
      ]);

      if (partsRes.data) setParts(partsRes.data);
      if (photosRes.data) setPhotos(photosRes.data);
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (isLocked) return;

    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'in_progress' && !intervention.started_at) {
        updates.started_at = new Date().toISOString();
      }

      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
        const totalPartsCost = parts.reduce((sum, part) => sum + part.total_price, 0);
        updates.actual_cost = totalPartsCost;
      }

      const { error } = await supabase
        .from('interventions')
        .update(updates)
        .eq('id', intervention.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      alert('Erreur lors de la mise à jour du statut');
      console.error(error);
    }
  };

  const handleMechanicChange = async (mechanicId: string) => {
    if (isLocked) return;

    try {
      const { error } = await supabase
        .from('interventions')
        .update({
          mechanic_id: mechanicId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', intervention.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      alert('Erreur lors de l\'assignation du mécanicien');
      console.error(error);
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (isLocked || !confirm('Supprimer cette pièce ?')) return;

    try {
      const { error } = await supabase
        .from('intervention_parts')
        .delete()
        .eq('id', partId);

      if (error) throw error;
      await loadDetails();
      onUpdate();
    } catch (error) {
      alert('Erreur lors de la suppression de la pièce');
      console.error(error);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Supprimer cette photo ?')) return;

    try {
      const { error } = await supabase
        .from('intervention_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
      await loadDetails();
    } catch (error) {
      alert('Erreur lors de la suppression de la photo');
      console.error(error);
    }
  };

  const client = clients.find((c) => c.id === intervention.client_id);
  const vehicle = vehicles.find((v) => v.id === intervention.vehicle_id);
  const mechanic = mechanics.find((m) => m.id === intervention.mechanic_id);

  const totalPartsCost = parts.reduce((sum, part) => sum + part.total_price, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-slate-900">Détails de l'intervention</h3>
            {isLocked && (
              <div className="flex items-center space-x-1 text-slate-500">
                <Lock className="w-4 h-4" />
                <span className="text-xs">Verrouillée</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2 text-orange-500" />
                Client & Véhicule
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">Client:</span>
                  <span className="ml-2 font-medium text-slate-900">{client?.name}</span>
                </div>
                <div>
                  <span className="text-slate-600">Véhicule:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {vehicle?.make} {vehicle?.model}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Plaque:</span>
                  <span className="ml-2 font-medium text-slate-900">{vehicle?.license_plate}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                Informations
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">Créée le:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {new Date(intervention.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {intervention.started_at && (
                  <div>
                    <span className="text-slate-600">Démarrée le:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {new Date(intervention.started_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {intervention.completed_at && (
                  <div>
                    <span className="text-slate-600">Terminée le:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {new Date(intervention.completed_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-orange-500" />
              Description
            </h4>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{intervention.description}</p>
          </div>

          {intervention.notes && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-orange-500" />
                Notes internes
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{intervention.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900 text-sm">Statut</h4>
                {canEdit && !isLocked && (
                  <select
                    value={intervention.status}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as 'pending' | 'in_progress' | 'completed')
                    }
                    className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="pending">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminée</option>
                  </select>
                )}
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                  intervention.status
                )}`}
              >
                {getStatusLabel(intervention.status)}
              </span>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900 text-sm">Mécanicien</h4>
                {canEdit && !isLocked && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-700">{mechanic?.full_name || 'Non assigné'}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 text-sm mb-2">Coûts</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimé:</span>
                  <span className="font-medium">{intervention.estimated_cost.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pièces:</span>
                  <span className="font-medium">{totalPartsCost.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-300">
                  <span className="text-slate-900 font-semibold">Réel:</span>
                  <span className="font-bold text-orange-600">
                    {intervention.actual_cost.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-orange-500" />
                Pièces utilisées
              </h4>
              {canEdit && !isLocked && (
                <button
                  onClick={() => {
                    setEditingPart(null);
                    setShowPartModal(true);
                  }}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              )}
            </div>

            {parts.length === 0 ? (
              <div className="bg-slate-50 rounded-lg p-8 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Aucune pièce ajoutée</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                        Pièce
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                        Qté
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                        Prix unit.
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                        Total
                      </th>
                      {canEdit && !isLocked && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parts.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-sm text-slate-900">{part.name}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{part.quantity}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">
                          {part.unit_price.toFixed(2)} €
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-slate-900">
                          {part.total_price.toFixed(2)} €
                        </td>
                        {canEdit && !isLocked && (
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleDeletePart(part.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan={3} className="px-4 py-2 text-sm text-slate-900 text-right">
                        Total:
                      </td>
                      <td className="px-4 py-2 text-sm text-orange-600">
                        {totalPartsCost.toFixed(2)} €
                      </td>
                      {canEdit && !isLocked && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-orange-500" />
                Photos ({photos.length})
              </h4>
              {canEdit && (
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              )}
            </div>

            {photos.length === 0 ? (
              <div className="bg-slate-50 rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Aucune photo ajoutée</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt={photo.description || 'Photo intervention'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {photo.description && (
                      <p className="text-xs text-slate-600 mt-1 truncate">{photo.description}</p>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      {showPartModal && (
        <PartModal
          tenantId={tenantId}
          interventionId={intervention.id}
          part={editingPart}
          onClose={() => {
            setShowPartModal(false);
            setEditingPart(null);
          }}
          onSuccess={() => {
            setShowPartModal(false);
            setEditingPart(null);
            loadDetails();
            onUpdate();
          }}
        />
      )}

      {showPhotoModal && (
        <PhotoModal
          tenantId={tenantId}
          interventionId={intervention.id}
          onClose={() => setShowPhotoModal(false)}
          onSuccess={() => {
            setShowPhotoModal(false);
            loadDetails();
          }}
        />
      )}

      {showEditModal && (
        <MechanicEditModal
          currentMechanicId={intervention.mechanic_id}
          mechanics={mechanics}
          onClose={() => setShowEditModal(false)}
          onSave={(mechanicId) => {
            handleMechanicChange(mechanicId);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

function PartModal({
  tenantId,
  interventionId,
  part,
  onClose,
  onSuccess,
}: {
  tenantId: string;
  interventionId: string;
  part: InterventionPart | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: part?.name || '',
    quantity: part?.quantity?.toString() || '1',
    unit_price: part?.unit_price?.toString() || '0',
  });
  const [loading, setLoading] = useState(false);

  const totalPrice = parseFloat(formData.quantity) * parseFloat(formData.unit_price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const partData = {
        tenant_id: tenantId,
        intervention_id: interventionId,
        name: formData.name.trim(),
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        total_price: totalPrice,
      };

      const { error } = await supabase.from('intervention_parts').insert(partData);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      alert('Erreur lors de l\'ajout de la pièce');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Ajouter une pièce</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la pièce *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Filtre à huile"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantité *</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                min="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix unit. (€) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                required
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Prix total:</span>
              <span className="text-lg font-bold text-orange-600">{totalPrice.toFixed(2)} €</span>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PhotoModal({
  tenantId,
  interventionId,
  onClose,
  onSuccess,
}: {
  tenantId: string;
  interventionId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    photo_url: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('intervention_photos').insert({
        tenant_id: tenantId,
        intervention_id: interventionId,
        photo_url: formData.photo_url.trim(),
        description: formData.description.trim() || null,
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      alert('Erreur lors de l\'ajout de la photo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Ajouter une photo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL de la photo *</label>
            <input
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://exemple.com/photo.jpg"
            />
            <p className="text-xs text-slate-500 mt-1">
              Entrez l'URL d'une image hébergée en ligne
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Description de la photo..."
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MechanicEditModal({
  currentMechanicId,
  mechanics,
  onClose,
  onSave,
}: {
  currentMechanicId: string | null;
  mechanics: Profile[];
  onClose: () => void;
  onSave: (mechanicId: string) => void;
}) {
  const [selectedMechanic, setSelectedMechanic] = useState(currentMechanicId || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Assigner un mécanicien</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <select
            value={selectedMechanic}
            onChange={(e) => setSelectedMechanic(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Non assigné</option>
            {mechanics.map((mechanic) => (
              <option key={mechanic.id} value={mechanic.id}>
                {mechanic.full_name}
              </option>
            ))}
          </select>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onSave(selectedMechanic)}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
