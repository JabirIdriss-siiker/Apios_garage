import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Eye, Trash2, Edit2, Download, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Intervention = Database['public']['Tables']['interventions']['Row'];

export default function FacturationPage() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'invoice' | 'quote'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    type: 'invoice' as 'invoice' | 'quote',
    client_id: '',
    intervention_id: '',
    invoice_number: '',
    quote_number: '',
    status: 'draft',
    description: '',
    notes: '',
    tax_rate: 20,
    issued_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [itemFormData, setItemFormData] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
  });

  useEffect(() => {
    loadData();
  }, [profile?.tenant_id]);

  const loadData = async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const [invoicesRes, clientsRes, interventionsRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('tenant_id', profile.tenant_id),
        supabase.from('interventions').select('*').eq('tenant_id', profile.tenant_id),
      ]);

      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (interventionsRes.data) setInterventions(interventionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNumber = (type: 'invoice' | 'quote') => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = invoices.filter(i => i.type === type).length + 1;
    const prefix = type === 'invoice' ? 'INV' : 'DEV';
    return `${prefix}-${year}${month}-${String(count).padStart(4, '0')}`;
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleAddItem = async () => {
    if (!selectedInvoice || !itemFormData.description || itemFormData.quantity <= 0 || itemFormData.unit_price < 0) {
      alert('Remplissez tous les champs correctement');
      return;
    }

    const subtotal = itemFormData.quantity * itemFormData.unit_price;

    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .insert([
          {
            invoice_id: selectedInvoice.id,
            description: itemFormData.description,
            quantity: itemFormData.quantity,
            unit_price: itemFormData.unit_price,
            subtotal,
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        setInvoiceItems([...invoiceItems, data[0]]);
        await updateInvoiceTotals(selectedInvoice.id);
        setItemFormData({ description: '', quantity: 1, unit_price: 0 });
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateInvoiceTotals = async (invoiceId: string) => {
    const itemsRes = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (itemsRes.data) {
      const subtotal = itemsRes.data.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) return;

      const taxRate = invoice.tax_rate;
      const taxAmount = subtotal * (taxRate / 100);
      const totalIncTax = subtotal + taxAmount;

      const { error } = await supabase
        .from('invoices')
        .update({
          subtotal_ex_tax: subtotal,
          tax_amount: taxAmount,
          total_inc_tax: totalIncTax,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (!error) {
        setInvoices(
          invoices.map(inv =>
            inv.id === invoiceId
              ? {
                  ...inv,
                  subtotal_ex_tax: subtotal,
                  tax_amount: taxAmount,
                  total_inc_tax: totalIncTax,
                }
              : inv
          )
        );
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('invoice_items').delete().eq('id', itemId);
      if (error) throw error;
      setInvoiceItems(invoiceItems.filter(item => item.id !== itemId));
      if (selectedInvoice) {
        await updateInvoiceTotals(selectedInvoice.id);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSaveInvoice = async () => {
    if (!profile?.tenant_id) return;

    if (!formData.client_id && !formData.intervention_id) {
      alert('Sélectionnez un client ou une intervention');
      return;
    }

    try {
      const invoiceData = {
        tenant_id: profile.tenant_id,
        type: formData.type,
        client_id: formData.client_id || null,
        intervention_id: formData.intervention_id || null,
        invoice_number: formData.type === 'invoice' ? (formData.invoice_number || generateNumber('invoice')) : null,
        quote_number: formData.type === 'quote' ? (formData.quote_number || generateNumber('quote')) : null,
        status: formData.status,
        description: formData.description,
        notes: formData.notes,
        tax_rate: formData.tax_rate,
        issued_date: formData.issued_date,
        due_date: formData.due_date,
        subtotal_ex_tax: 0,
        tax_amount: 0,
        total_inc_tax: 0,
        updated_at: new Date().toISOString(),
      };

      if (editingInvoice) {
        const { error } = await supabase.from('invoices').update(invoiceData).eq('id', editingInvoice.id);
        if (error) throw error;
        setInvoices(invoices.map(inv => (inv.id === editingInvoice.id ? { ...inv, ...invoiceData } : inv)));
      } else {
        const { data, error } = await supabase.from('invoices').insert([invoiceData]).select();
        if (error) throw error;
        if (data) {
          setInvoices([data[0], ...invoices]);
          setSelectedInvoice(data[0]);
        }
      }

      setEditingInvoice(null);
      resetForm();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture/devis?')) {
      try {
        const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
        if (error) throw error;
        setInvoices(invoices.filter(inv => inv.id !== invoiceId));
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(null);
          setInvoiceItems([]);
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'paid') {
        updateData.paid_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase.from('invoices').update(updateData).eq('id', invoiceId);
      if (error) throw error;

      setInvoices(
        invoices.map(inv => (inv.id === invoiceId ? { ...inv, status: newStatus, paid_date: updateData.paid_date } : inv))
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'invoice',
      client_id: '',
      intervention_id: '',
      invoice_number: '',
      quote_number: '',
      status: 'draft',
      description: '',
      notes: '',
      tax_rate: 20,
      issued_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    const typeMatch = filterType === 'all' || inv.type === filterType;
    const statusMatch = filterStatus === 'all' || inv.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      draft: { bg: 'bg-slate-100', text: 'text-slate-700', icon: FileText },
      sent: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Send },
      paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 p-6">
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value="all">Tous les types</option>
              <option value="invoice">Factures</option>
              <option value="quote">Devis</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé</option>
              <option value="paid">Payé</option>
              <option value="overdue">En retard</option>
            </select>
          </div>

          <button
            onClick={() => {
              resetForm();
              setEditingInvoice(null);
              setSelectedInvoice(null);
              setInvoiceItems([]);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle facture/devis</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow divide-y">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Aucune facture/devis trouvée</div>
          ) : (
            filteredInvoices.map(invoice => (
              <div key={invoice.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {invoice.type === 'invoice' ? invoice.invoice_number : invoice.quote_number}
                        </p>
                        <p className="text-sm text-slate-600">
                          {clients.find(c => c.id === invoice.client_id)?.name || 'Client'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{invoice.total_inc_tax?.toFixed(2)}€</p>
                      <p className="text-xs text-slate-600">{new Date(invoice.issued_date).toLocaleDateString('fr-FR')}</p>
                    </div>

                    {getStatusBadge(invoice.status)}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>

                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="w-96 bg-white rounded-lg shadow-lg p-6 overflow-y-auto max-h-screen">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              {selectedInvoice ? 'Détails' : 'Nouvelle facture/devis'}
            </h3>
          </div>

          {!selectedInvoice ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'invoice' | 'quote' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="invoice">Facture</option>
                    <option value="quote">Devis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                  <select
                    value={formData.client_id}
                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Intervention (optionnel)</label>
                  <select
                    value={formData.intervention_id}
                    onChange={e => setFormData({ ...formData, intervention_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Sans intervention</option>
                    {interventions.map(intervention => (
                      <option key={intervention.id} value={intervention.id}>
                        {intervention.description?.substring(0, 50)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Description générale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Taux TVA (%)</label>
                  <input
                    type="number"
                    value={formData.tax_rate}
                    onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date d'émission</label>
                    <input
                      type="date"
                      value={formData.issued_date}
                      onChange={e => setFormData({ ...formData, issued_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date limite</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-20"
                    placeholder="Notes additionnelles"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSaveInvoice}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-6 pb-6 border-b">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Numéro</p>
                  <p className="font-medium text-slate-900">{selectedInvoice.type === 'invoice' ? selectedInvoice.invoice_number : selectedInvoice.quote_number}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-1">Client</p>
                  <p className="font-medium text-slate-900">{clients.find(c => c.id === selectedInvoice.client_id)?.name}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-1">Statut</p>
                  <select
                    value={selectedInvoice.status}
                    onChange={e => handleStatusChange(selectedInvoice.id, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="sent">Envoyé</option>
                    <option value="paid">Payé</option>
                    <option value="overdue">En retard</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-1">Montant</p>
                  <p className="text-2xl font-bold text-orange-500">{selectedInvoice.total_inc_tax?.toFixed(2)}€</p>
                  <p className="text-xs text-slate-600 mt-1">
                    HT: {selectedInvoice.subtotal_ex_tax?.toFixed(2)}€ | TVA: {selectedInvoice.tax_amount?.toFixed(2)}€
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">Articles</h4>
                  <button
                    onClick={() => setShowItemModal(true)}
                    className="flex items-center space-x-1 text-sm text-orange-500 hover:text-orange-600"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {invoiceItems.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">Aucun article</p>
                  ) : (
                    invoiceItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{item.description}</p>
                          <p className="text-xs text-slate-600">{item.quantity} × {item.unit_price?.toFixed(2)}€ = {item.subtotal?.toFixed(2)}€</p>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {showItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-4 w-96 shadow-xl">
                    <h4 className="font-bold text-slate-900 mb-4">Ajouter un article</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Description"
                        value={itemFormData.description}
                        onChange={e => setItemFormData({ ...itemFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Quantité"
                        value={itemFormData.quantity}
                        onChange={e => setItemFormData({ ...itemFormData, quantity: parseFloat(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        min="0.1"
                        step="0.1"
                      />
                      <input
                        type="number"
                        placeholder="Prix unitaire"
                        value={itemFormData.unit_price}
                        onChange={e => setItemFormData({ ...itemFormData, unit_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-sm font-medium text-slate-900">
                        Sous-total: {(itemFormData.quantity * itemFormData.unit_price).toFixed(2)}€
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleAddItem}
                        className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => setShowItemModal(false)}
                        className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
