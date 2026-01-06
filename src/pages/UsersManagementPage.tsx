import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Search, User as UserIcon, Lock, Plus } from 'lucide-react';
import PermissionsModal from '../components/PermissionsModal';
import CreateUserModal from '../components/CreateUserModal';
import LimitGauge from '../components/LimitGauge';
import UpgradeButton from '../components/UpgradeButton';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function UsersManagementPage() {
    const { can } = usePermissions();
    const { profile: currentUser } = useAuth();
    const subscription = useSubscription();

    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [currentUser?.tenant_id]);

    const loadUsers = async () => {
        if (!currentUser?.tenant_id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('tenant_id', currentUser.tenant_id)
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!can.manageUsers) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Refusé</h2>
                    <p className="text-slate-600">
                        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-indigo-500 p-2 rounded-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Gestion des Utilisateurs</h2>
                                <p className="text-sm text-slate-500">Gérez les rôles et permissions des membres de votre équipe</p>
                            </div>
                        </div>

                        {/* Create User Button or Upgrade Button */}
                        {subscription.limits.users.isReached ? (
                            <UpgradeButton message="Limite d'utilisateurs atteinte" variant="secondary" />
                        ) : (
                            <button
                                onClick={() => setShowCreateUserModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Nouvel Utilisateur</span>
                            </button>
                        )}
                    </div>

                    {/* Subscription Limit Gauge */}
                    {!subscription.loading && subscription.plan && (
                        <div className="mt-6 max-w-md">
                            <LimitGauge
                                label="Utilisateurs"
                                used={subscription.limits.users.used}
                                max={subscription.limits.users.max}
                            />
                        </div>
                    )}

                    <div className="mt-6 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Rôle
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                        Aucun utilisateur trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                    <UserIcon className="w-5 h-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {user.full_name || 'Sans nom'}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {user.email || 'Pas d\'email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.role === 'TENANT_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'MECHANIC' ? 'bg-blue-100 text-blue-800' :
                                                        user.role === 'ACCOUNTANT' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowPermissionsModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                                            >
                                                Gérer Permissions
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPermissionsModal && selectedUser && (
                <PermissionsModal
                    user={selectedUser}
                    onClose={() => {
                        setShowPermissionsModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}

            {showCreateUserModal && (
                <CreateUserModal
                    onClose={() => setShowCreateUserModal(false)}
                    onSuccess={() => {
                        loadUsers();
                        setShowCreateUserModal(false);
                    }}
                />
            )}
        </main>
    );
}
