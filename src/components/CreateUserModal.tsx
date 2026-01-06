import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, User, Mail, Phone, Shield } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface CreateUserModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
    const { signUp, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'RECEPTION' as Profile['role'],
        phone: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile?.tenant_id) {
            alert('Erreur: Tenant ID non trouvé');
            return;
        }

        setLoading(true);
        try {
            await signUp(
                formData.email,
                formData.password,
                formData.full_name,
                formData.role,
                profile.tenant_id
            );

            alert('Utilisateur créé avec succès!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Erreur lors de la création de l\'utilisateur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Nouvel Utilisateur</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Nom complet *
                            </div>
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Jean Dupont"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email *
                            </div>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="jean.dupont@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Mot de passe *
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-slate-500 mt-1">Minimum 6 caractères</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Rôle *
                            </div>
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Profile['role'] })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="RECEPTION">Réception</option>
                            <option value="MECHANIC">Mécanicien</option>
                            <option value="ACCOUNTANT">Comptable</option>
                            <option value="TENANT_ADMIN">Admin Garage</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Téléphone
                            </div>
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="+33 6 12 34 56 78"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
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
                            {loading ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
