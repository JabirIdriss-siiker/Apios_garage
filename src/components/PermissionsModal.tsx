import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Check, Shield, Info } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Permission = Database['public']['Tables']['permissions']['Row'];

interface PermissionsModalProps {
    user: Profile;
    onClose: () => void;
}

export default function PermissionsModal({ user, onClose }: PermissionsModalProps) {
    const { profile: currentUser } = useAuth();
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [user.id, user.role]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch all available permissions
            const { data: perms } = await supabase
                .from('permissions')
                .select('*')
                .order('category')
                .order('name');

            if (perms) setAllPermissions(perms);

            // 2. Fetch permissions granted by role
            const { data: rolePerms } = await supabase
                .from('role_permissions')
                .select('permission_code')
                .eq('role', user.role);

            if (rolePerms) {
                setRolePermissions(rolePerms.map(p => p.permission_code));
            }

            // 3. Fetch custom user permissions
            const { data: userPerms } = await supabase
                .from('user_permissions')
                .select('permission_code')
                .eq('user_id', user.id);

            if (userPerms) {
                setUserPermissions(userPerms.map(p => p.permission_code));
            }

        } catch (error) {
            console.error('Error loading permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = async (permissionCode: string) => {
        if (saving) return;
        setSaving(true);

        try {
            const isCustom = userPermissions.includes(permissionCode);

            if (isCustom) {
                // Remove custom permission
                const { error } = await supabase
                    .from('user_permissions')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('permission_code', permissionCode);

                if (error) throw error;
                setUserPermissions(prev => prev.filter(p => p !== permissionCode));
            } else {
                // Grant custom permission
                const { error } = await supabase
                    .from('user_permissions')
                    .insert({
                        user_id: user.id,
                        permission_code: permissionCode,
                        granted_by: currentUser?.id
                    });

                if (error) throw error;
                setUserPermissions(prev => [...prev, permissionCode]);
            }
        } catch (error) {
            console.error('Error toggling permission:', error);
            alert('Erreur lors de la modification des permissions');
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by category
    const permissionsByCategory = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const formatCategory = (category: string) => {
        switch (category) {
            case 'clients': return '👥 Clients';
            case 'vehicles': return '🚗 Véhicules';
            case 'interventions': return '🔧 Interventions';
            case 'invoices': return '💰 Facturation';
            case 'admin': return '🛡️ Administration';
            default: return category;
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6">Loading...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-orange-500" />
                            Gérer les permissions
                        </h2>
                        <p className="text-slate-600 mt-1">
                            Utilisateur: <span className="font-semibold text-slate-900">{user.full_name}</span> ({user.role})
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                        <div key={category} className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 capitalize border-b pb-2">
                                {formatCategory(category)}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {perms.map((perm) => {
                                    const isInherited = rolePermissions.includes(perm.code);
                                    const isCustom = userPermissions.includes(perm.code);
                                    const isGranted = isInherited || isCustom;

                                    return (
                                        <div
                                            key={perm.code}
                                            className={`
                        border rounded-lg p-4 transition-colors relative
                        ${isGranted ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 hover:border-orange-300'}
                        ${isInherited ? 'opacity-75 cursor-default' : 'cursor-pointer'}
                      `}
                                            onClick={() => !isInherited && togglePermission(perm.code)}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`
                          text-sm font-semibold
                          ${isGranted ? 'text-orange-900' : 'text-slate-700'}
                        `}>
                                                    {perm.name}
                                                </span>
                                                {isGranted && (
                                                    <div className={`
                            rounded-full p-1 
                            ${isInherited ? 'bg-slate-200 text-slate-600' : 'bg-orange-200 text-orange-700'}
                          `}>
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mb-2">
                                                {perm.description}
                                            </p>

                                            <div className="text-xs font-medium flex items-center gap-1">
                                                {isInherited ? (
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <Shield className="w-3 h-3" /> Hérité du rôle
                                                    </span>
                                                ) : isCustom ? (
                                                    <span className="text-orange-600 flex items-center gap-1">
                                                        <Info className="w-3 h-3" /> Permission ajoutée
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">Non accordé</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-lg flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
