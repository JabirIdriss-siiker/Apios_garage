import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Clock, User } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function PlanningPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [mechanics, setMechanics] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    loadData();
  }, [profile?.tenant_id, currentWeekStart]);

  const loadData = async () => {
    if (!profile?.tenant_id) return;

    setLoading(true);
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const [appointmentsRes, servicesRes, clientsRes, mechanicsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .gte('appointment_date', currentWeekStart.toISOString().split('T')[0])
          .lte('appointment_date', weekEnd.toISOString().split('T')[0])
          .order('appointment_date')
          .order('start_time'),
        supabase
          .from('services')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('clients')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .order('name'),
        supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('role', 'MECHANIC')
          .order('full_name')
      ]);

      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (mechanicsRes.data) setMechanics(mechanicsRes.data);
    } catch (error) {
      console.error('Error loading planning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const previousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return 'Non spécifié';
    return services.find(s => s.id === serviceId)?.name || 'Service inconnu';
  };

  const getMechanicName = (mechanicId: string | null) => {
    if (!mechanicId) return 'Non assigné';
    return mechanics.find(m => m.id === mechanicId)?.full_name || 'Mécanicien inconnu';
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
              <Calendar className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-slate-900">Planning</h2>
            </div>
            <button
              onClick={() => {
                setSelectedAppointment(null);
                setShowModal(true);
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nouveau Rendez-vous</span>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={previousWeek}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {currentWeekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
              >
                Aujourd'hui
              </button>
            </div>

            <button
              onClick={nextWeek}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[800px]">
            {getWeekDays().map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayAppointments = getAppointmentsForDay(date);

              return (
                <div
                  key={index}
                  className={`border-r border-slate-200 min-h-[400px] ${
                    index === 6 ? 'border-r-0' : ''
                  }`}
                >
                  <div
                    className={`p-3 border-b border-slate-200 text-center ${
                      isToday ? 'bg-orange-50' : 'bg-slate-50'
                    }`}
                  >
                    <div className="text-xs text-slate-600 uppercase">
                      {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div
                      className={`text-lg font-semibold mt-1 ${
                        isToday ? 'text-orange-600' : 'text-slate-900'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>

                  <div className="p-2 space-y-2">
                    {dayAppointments.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">
                        Aucun rendez-vous
                      </p>
                    ) : (
                      dayAppointments.map((apt) => (
                        <button
                          key={apt.id}
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setShowModal(true);
                          }}
                          className={`w-full text-left p-2 rounded border-l-4 text-xs hover:shadow-md transition-all ${getStatusColor(
                            apt.status
                          )}`}
                        >
                          <div className="font-medium truncate">{apt.customer_name}</div>
                          <div className="flex items-center space-x-1 mt-1 text-slate-600">
                            <Clock className="w-3 h-3" />
                            <span>
                              {apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}
                            </span>
                          </div>
                          <div className="mt-1 truncate">{getServiceName(apt.service_id)}</div>
                          {apt.mechanic_id && (
                            <div className="flex items-center space-x-1 mt-1 text-slate-600">
                              <User className="w-3 h-3" />
                              <span className="truncate">{getMechanicName(apt.mechanic_id)}</span>
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <AppointmentModal
          tenantId={profile?.tenant_id!}
          appointment={selectedAppointment}
          services={services}
          clients={clients}
          mechanics={mechanics}
          onClose={() => {
            setShowModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedAppointment(null);
            loadData();
          }}
        />
      )}
    </main>
  );
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function AppointmentModal({
  tenantId,
  appointment,
  services,
  clients,
  mechanics,
  onClose,
  onSuccess,
}: {
  tenantId: string;
  appointment: Appointment | null;
  services: Service[];
  clients: Client[];
  mechanics: Profile[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    client_id: appointment?.client_id || '',
    service_id: appointment?.service_id || '',
    mechanic_id: appointment?.mechanic_id || '',
    appointment_date: appointment?.appointment_date || new Date().toISOString().split('T')[0],
    start_time: appointment?.start_time?.substring(0, 5) || '09:00',
    end_time: appointment?.end_time?.substring(0, 5) || '10:00',
    status: appointment?.status || 'scheduled',
    customer_name: appointment?.customer_name || '',
    customer_phone: appointment?.customer_phone || '',
    customer_email: appointment?.customer_email || '',
    notes: appointment?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = appointment && ['TENANT_ADMIN', 'RECEPTION'].includes(
    useAuth().profile?.role || ''
  );

  const handleDelete = async () => {
    if (!appointment || !confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) return;

    setLoading(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (deleteError) throw deleteError;
      onSuccess();
    } catch (err) {
      setError('Erreur lors de la suppression du rendez-vous');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkOverlap = async (mechanicId: string, date: string, startTime: string, endTime: string, excludeId?: string) => {
    if (!mechanicId) return false;

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('mechanic_id', mechanicId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error checking overlap:', error);
      return false;
    }

    const overlapping = data?.filter(apt => {
      if (excludeId && apt.id === excludeId) return false;

      const aptStart = apt.start_time.substring(0, 5);
      const aptEnd = apt.end_time.substring(0, 5);

      return (
        (startTime >= aptStart && startTime < aptEnd) ||
        (endTime > aptStart && endTime <= aptEnd) ||
        (startTime <= aptStart && endTime >= aptEnd)
      );
    });

    return (overlapping?.length || 0) > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.start_time >= formData.end_time) {
        setError('L\'heure de fin doit être après l\'heure de début');
        setLoading(false);
        return;
      }

      if (formData.mechanic_id) {
        const hasOverlap = await checkOverlap(
          formData.mechanic_id,
          formData.appointment_date,
          formData.start_time,
          formData.end_time,
          appointment?.id
        );

        if (hasOverlap) {
          setError('Ce mécanicien a déjà un rendez-vous qui chevauche cet horaire');
          setLoading(false);
          return;
        }
      }

      let customerName = formData.customer_name;
      let customerPhone = formData.customer_phone;
      let customerEmail = formData.customer_email;

      if (formData.client_id) {
        const client = clients.find(c => c.id === formData.client_id);
        if (client) {
          customerName = client.name;
          customerPhone = client.phone || '';
          customerEmail = client.email || '';
        }
      }

      const appointmentData = {
        tenant_id: tenantId,
        client_id: formData.client_id || null,
        service_id: formData.service_id || null,
        mechanic_id: formData.mechanic_id || null,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        status: formData.status,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      };

      if (appointment) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('appointments')
          .insert(appointmentData);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      setError('Erreur lors de la sauvegarde du rendez-vous');
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
            {appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
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
                Client
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Client non enregistré (saisie manuelle)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {!formData.client_id && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="jean.dupont@exemple.com"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service
              </label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Sélectionner un service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.estimated_duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mécanicien
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
                Date *
              </label>
              <input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Statut *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="scheduled">Programmé</option>
                <option value="confirmed">Confirmé</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Heure de début *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Heure de fin *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Informations additionnelles..."
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Supprimer
              </button>
            )}
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
              {loading ? 'Enregistrement...' : appointment ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
