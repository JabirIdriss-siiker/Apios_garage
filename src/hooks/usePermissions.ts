import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export interface Permission {
    code: string;
    name: string;
    description: string;
    category: string;
}

export function usePermissions() {
    const { profile } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) {
            setLoading(false);
            return;
        }
        loadPermissions();
    }, [profile?.id]);

    const loadPermissions = async () => {
        if (!profile) return;

        try {
            // SUPERADMIN a toutes les permissions
            if (profile.role === 'SUPERADMIN') {
                const { data: allPerms } = await supabase
                    .from('permissions')
                    .select('code');

                setPermissions(allPerms?.map(p => p.code) || []);
                setLoading(false);
                return;
            }

            // 1. Charger permissions par défaut du rôle
            const { data: rolePerms } = await supabase
                .from('role_permissions')
                .select('permission_code')
                .eq('role', profile.role);

            // 2. Charger permissions personnalisées de l'utilisateur
            const { data: userPerms } = await supabase
                .from('user_permissions')
                .select('permission_code')
                .eq('user_id', profile.id);

            // 3. Combiner les deux
            const allPerms = [
                ...(rolePerms?.map(p => p.permission_code) || []),
                ...(userPerms?.map(p => p.permission_code) || [])
            ];

            setPermissions([...new Set(allPerms)]); // Dédupliquer
        } catch (error) {
            console.error('Error loading permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (permission: string): boolean => {
        // SUPERADMIN a toutes les permissions
        if (profile?.role === 'SUPERADMIN') return true;

        // Vérifier permission exacte
        if (permissions.includes(permission)) return true;

        // Vérifier wildcards (ex: 'clients:*' couvre 'clients:create')
        const [category] = permission.split(':');
        return permissions.includes(`${category}:*`);
    };

    const can = {
        // Clients
        viewClients: hasPermission('clients:view'),
        createClient: hasPermission('clients:create'),
        updateClient: hasPermission('clients:update'),
        deleteClient: hasPermission('clients:delete'),

        // Véhicules
        viewVehicles: hasPermission('vehicles:view'),
        createVehicle: hasPermission('vehicles:create'),
        updateVehicle: hasPermission('vehicles:update'),
        deleteVehicle: hasPermission('vehicles:delete'),

        // Interventions
        viewInterventions: hasPermission('interventions:view'),
        createIntervention: hasPermission('interventions:create'),
        updateIntervention: hasPermission('interventions:update'),
        updateOwnIntervention: hasPermission('interventions:update:own'),
        deleteIntervention: hasPermission('interventions:delete'),
        addParts: hasPermission('interventions:parts:add'),
        editPricing: hasPermission('interventions:pricing:edit'),

        // Factures
        viewInvoices: hasPermission('invoices:view'),
        createInvoice: hasPermission('invoices:create'),
        updateInvoice: hasPermission('invoices:update'),
        deleteInvoice: hasPermission('invoices:delete'),

        // Admin
        manageUsers: hasPermission('users:manage'),
        manageSettings: hasPermission('settings:manage'),
        viewReports: hasPermission('reports:view'),
    };

    return { can, hasPermission, permissions, loading, refresh: loadPermissions };
}
