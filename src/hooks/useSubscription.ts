import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
type TenantSubscription = Database['public']['Tables']['tenant_subscriptions']['Row'];

interface SubscriptionLimits {
    users: { used: number; max: number; isReached: boolean };
    vehicles: { used: number; max: number; isReached: boolean };
    storage: { used: number; max: number; isReached: boolean };
}

interface SubscriptionFeatures {
    advancedReports: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
}

interface SubscriptionState {
    plan: SubscriptionPlan | null;
    subscription: TenantSubscription | null;
    status: 'active' | 'suspended' | 'canceled' | 'none';
    limits: SubscriptionLimits;
    features: SubscriptionFeatures;
    loading: boolean;
    error: string | null;
}

export function useSubscription(): SubscriptionState {
    const { profile } = useAuth();
    const [state, setState] = useState<SubscriptionState>({
        plan: null,
        subscription: null,
        status: 'none',
        limits: {
            users: { used: 0, max: 0, isReached: false },
            vehicles: { used: 0, max: 0, isReached: false },
            storage: { used: 0, max: 0, isReached: false },
        },
        features: {
            advancedReports: false,
            apiAccess: false,
            customBranding: false,
            prioritySupport: false,
        },
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!profile?.tenant_id) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        loadSubscriptionData();
    }, [profile?.tenant_id]);

    const loadSubscriptionData = async () => {
        if (!profile?.tenant_id) return;

        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            // Load tenant subscription and plan
            const { data: subscription, error: subError } = await supabase
                .from('tenant_subscriptions')
                .select('*, subscription_plans(*)')
                .eq('tenant_id', profile.tenant_id)
                .eq('status', 'active')
                .maybeSingle();

            if (subError) throw subError;

            // If no subscription, use a default "free" state
            if (!subscription) {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    status: 'none',
                }));
                return;
            }

            // Count current usage
            const [usersCount, vehiclesCount] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('tenant_id', profile.tenant_id),
                supabase
                    .from('vehicles')
                    .select('id', { count: 'exact', head: true })
                    .eq('tenant_id', profile.tenant_id),
            ]);

            const usedUsers = usersCount.count || 0;
            const usedVehicles = vehiclesCount.count || 0;

            // Extract plan data
            const plan = subscription.subscription_plans as unknown as SubscriptionPlan;
            const maxUsers = plan?.max_users || 0;
            const maxVehicles = plan?.max_vehicles || 0;
            const maxStorage = plan?.max_storage_gb || 0;

            // Parse features from JSON
            const planFeatures = (plan?.features as any) || {};
            const features: SubscriptionFeatures = {
                advancedReports: planFeatures.advanced_reports === true,
                apiAccess: planFeatures.api_access === true,
                customBranding: planFeatures.custom_branding === true,
                prioritySupport: planFeatures.priority_support === true,
            };

            setState({
                plan,
                subscription,
                status: subscription.status as 'active' | 'suspended' | 'canceled',
                limits: {
                    users: {
                        used: usedUsers,
                        max: maxUsers,
                        isReached: usedUsers >= maxUsers,
                    },
                    vehicles: {
                        used: usedVehicles,
                        max: maxVehicles,
                        isReached: usedVehicles >= maxVehicles,
                    },
                    storage: {
                        used: 0, // TODO: Calculate actual storage usage
                        max: maxStorage,
                        isReached: false,
                    },
                },
                features,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error('Error loading subscription:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to load subscription',
            }));
        }
    };

    return state;
}
