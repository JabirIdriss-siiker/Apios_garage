import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, CheckCircle, AlertCircle, Car } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Service = Database['public']['Tables']['services']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];

export default function PublicBookingPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    vehicle_plate: '',
    vehicle_make: '',
    vehicle_model: '',
    service_id: '',
    appointment_date: '',
    start_time: '09:00',
    notes: '',
  });

  useEffect(() => {
    loadTenantAndServices();
  }, []);

  const loadTenantAndServices = async () => {
    setLoading(true);
    setError('');

    try {
      const slug = window.location.pathname.split('/booking/')[1];

      if (!slug) {
        setError('URL de réservation invalide');
        setLoading(false);
        return;
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (tenantError) throw tenantError;

      if (!tenantData) {
        setError('Garage introuvable');
        setLoading(false);
        return;
      }

      setTenant(tenantData);

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;

      setServices(servicesData || []);
    } catch (err) {
      console.error('Error loading booking page:', err);
      setError('Erreur lors du chargement de la page');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime: string, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return startTime;

    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + service.estimated_duration_minutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!tenant) {
        setError('Erreur: garage non trouvé');
        setSubmitting(false);
        return;
      }

      const endTime = calculateEndTime(formData.start_time, formData.service_id);

      let clientId = null;

      if (formData.customer_email) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('email', formData.customer_email)
          .maybeSingle();

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              tenant_id: tenant.id,
              name: formData.customer_name,
              email: formData.customer_email,
              phone: formData.customer_phone || null,
            })
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: tenant.id,
          client_id: clientId,
          service_id: formData.service_id || null,
          appointment_date: formData.appointment_date,
          start_time: formData.start_time,
          end_time: endTime,
          status: 'scheduled',
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone || null,
          customer_email: formData.customer_email || null,
          vehicle_plate: formData.vehicle_plate || null,
          vehicle_make: formData.vehicle_make || null,
          vehicle_model: formData.vehicle_model || null,
          notes: formData.notes || null,
        });

      if (appointmentError) throw appointmentError;

      setSuccess(true);
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        vehicle_plate: '',
        vehicle_make: '',
        vehicle_model: '',
        service_id: '',
        appointment_date: '',
        start_time: '09:00',
        notes: '',
      });
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Erreur lors de la création du rendez-vous. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Erreur</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Rendez-vous confirmé</h1>
          <p className="text-slate-600 mb-6">
            Votre demande de rendez-vous a été envoyée avec succès. Le garage {tenant?.name} vous
            contactera prochainement pour confirmer votre rendez-vous.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Prendre un autre rendez-vous
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-10 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-orange-500 p-3 rounded-lg">
                <Calendar className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">{tenant?.name}</h1>
            <p className="text-center text-slate-300">
              Réservez votre rendez-vous en ligne
            </p>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    1
                  </span>
                  Vos informations
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="06 12 34 56 78"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="jean.dupont@exemple.com"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    2
                  </span>
                  Votre véhicule
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Plaque d'immatriculation *
                    </label>
                    <input
                      type="text"
                      value={formData.vehicle_plate}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })
                      }
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="AB-123-CD"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Marque *
                    </label>
                    <input
                      type="text"
                      value={formData.vehicle_make}
                      onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Renault"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Modèle *
                    </label>
                    <input
                      type="text"
                      value={formData.vehicle_model}
                      onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Clio"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    3
                  </span>
                  Détails du rendez-vous
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Service souhaité *
                    </label>
                    <select
                      value={formData.service_id}
                      onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Sélectionner un service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.estimated_duration_minutes} min
                          {service.price ? ` - ${service.price.toFixed(2)} €` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date souhaitée *
                    </label>
                    <input
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Heure souhaitée *
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Remarques ou demandes particulières
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Décrivez le problème ou vos besoins..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5 mr-2" />
                      Réserver mon rendez-vous
                    </>
                  )}
                </button>

                <p className="mt-4 text-sm text-slate-500 text-center">
                  En soumettant ce formulaire, vous acceptez d'être contacté par {tenant?.name} pour
                  confirmer votre rendez-vous.
                </p>
              </div>
            </form>
          </div>
        </div>

        {tenant?.phone && (
          <div className="mt-6 bg-white rounded-lg shadow p-4 text-center">
            <p className="text-slate-600">
              Vous préférez nous appeler ?{' '}
              <a href={`tel:${tenant.phone}`} className="text-orange-600 font-medium hover:text-orange-700">
                {tenant.phone}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
