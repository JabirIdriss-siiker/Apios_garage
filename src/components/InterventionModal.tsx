import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Intervention = Database['public']['Tables']['interventions']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface InterventionModalProps {
  tenantId: string;
  intervention: Intervention | null;
  clients: Client[];
  vehicles: Vehicle[];
  mechanics: Profile[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function InterventionModal({
  tenantId,
  intervention,
  clients,
  vehicles,
  mechanics,
  onClose,
  onSuccess,
}: InterventionModalProps) {
  const [formData, setFormData] = useState({
    client_id: intervention?.client_id || '',
    vehicle_id: intervention?.vehicle_id || '',
    mechanic_id: intervention?.mechanic_id || '',
    description: intervention?.description || '',
    estimated_cost: intervention?.estimated_cost?.toString() || '0',
    status: intervention?.status || 'pending',
    notes: intervention?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clientVehicles = vehicles.filter(v => v.client_id === formData.client_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const interventionData = {
        tenant_id: tenantId,
        client_id: formData.client_id,
        vehicle_id: formData.vehicle_id,
        mechanic_id: formData.mechanic_id || null,
        description: formData.description.trim(),
        estimated_cost: parseFloat(formData.estimated_cost),
        status: formData.status as 'pending' | 'in_progress' | 'completed',
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (intervention) {
        const { error: updateError } = await supabase
          .from('interventions')
          .update(interventionData)
          .eq('id', intervention.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('interventions')
          .insert(interventionData);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      setError('Erreur lors de la sauvegarde de l\'intervention');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900">
            {intervention ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Client *
              </label>
              <select
                value={formData.client_id}
                onChange={(e) =>
                  setFormData({ ...formData, client_id: e.target.value, vehicle_id: '' })
                }
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Véhicule *
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                required
                disabled={!formData.client_id}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Sélectionner un véhicule</option>
                {clientVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                  </option>
                ))}
              </select>
              {formData.client_id && clientVehicles.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Ce client n'a aucun véhicule enregistré
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description de l'intervention *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Décrivez les travaux à effectuer..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mécanicien assigné
              </label>
              <select
                value={formData.mechanic_id}
                onChange={(e) => setFormData({ ...formData, mechanic_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Non assigné</option>
                {mechanics.map((mechanic) => (
                  <option key={mechanic.id} value={mechanic.id}>
                    {mechanic.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Coût estimé (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                required
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Statut *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes internes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Notes privées sur l'intervention..."
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
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
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : intervention ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
