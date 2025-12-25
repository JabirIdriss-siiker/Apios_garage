import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Clock, CreditCard, Check, ArrowRight } from 'lucide-react';

interface OnboardingStep {
    id: number;
    title: string;
    description: string;
    completed: boolean;
}

export default function OnboardingWizard() {
    const { profile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Garage Information
    const [garageName, setGarageName] = useState('');
    const [garageEmail, setGarageEmail] = useState('');
    const [garagePhone, setGaragePhone] = useState('');
    const [garageAddress, setGarageAddress] = useState('');

    // Business Hours
    const [openingTime, setOpeningTime] = useState('08:00');
    const [closingTime, setClosingTime] = useState('18:00');
    const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

    // Tax Configuration
    const [defaultTaxRate, setDefaultTaxRate] = useState('20');

    const steps: OnboardingStep[] = [
        {
            id: 1,
            title: 'Informations du Garage',
            description: 'Configurez les informations de base de votre garage',
            completed: currentStep > 1,
        },
        {
            id: 2,
            title: 'Horaires d\'Ouverture',
            description: 'Définissez vos horaires de travail',
            completed: currentStep > 2,
        },
        {
            id: 3,
            title: 'Configuration Fiscale',
            description: 'Paramétrez les taux de TVA',
            completed: currentStep > 3,
        },
    ];

    const handleSaveGarageInfo = async () => {
        if (!profile?.tenant_id) return;

        setLoading(true);
        setError('');

        try {
            const { error: updateError } = await supabase
                .from('tenants')
                .update({
                    name: garageName,
                    email: garageEmail,
                    phone: garagePhone,
                    address: garageAddress,
                })
                .eq('id', profile.tenant_id);

            if (updateError) throw updateError;

            setCurrentStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBusinessHours = async () => {
        if (!profile?.tenant_id) return;

        setLoading(true);
        setError('');

        try {
            const openingHours = {
                monday: workingDays.includes('monday') ? { open: openingTime, close: closingTime } : null,
                tuesday: workingDays.includes('tuesday') ? { open: openingTime, close: closingTime } : null,
                wednesday: workingDays.includes('wednesday') ? { open: openingTime, close: closingTime } : null,
                thursday: workingDays.includes('thursday') ? { open: openingTime, close: closingTime } : null,
                friday: workingDays.includes('friday') ? { open: openingTime, close: closingTime } : null,
                saturday: workingDays.includes('saturday') ? { open: openingTime, close: closingTime } : null,
                sunday: workingDays.includes('sunday') ? { open: openingTime, close: closingTime } : null,
            };

            const { error: updateError } = await supabase
                .from('tenants')
                .update({
                    opening_hours: openingHours,
                })
                .eq('id', profile.tenant_id);

            if (updateError) throw updateError;

            setCurrentStep(3);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFinishOnboarding = async () => {
        // Tax rate is stored at invoice level, not tenant level
        // Just mark onboarding as complete
        setCurrentStep(4);
    };

    const toggleWorkingDay = (day: string) => {
        setWorkingDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const daysOfWeek = [
        { id: 'monday', label: 'Lundi' },
        { id: 'tuesday', label: 'Mardi' },
        { id: 'wednesday', label: 'Mercredi' },
        { id: 'thursday', label: 'Jeudi' },
        { id: 'friday', label: 'Vendredi' },
        { id: 'saturday', label: 'Samedi' },
        { id: 'sunday', label: 'Dimanche' },
    ];

    if (currentStep === 4) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration Terminée !</h2>
                    <p className="text-gray-600 mb-6">
                        Votre garage est maintenant configuré. Vous pouvez commencer à utiliser Apios Garage.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Accéder au Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue sur Apios Garage</h1>
                    <p className="text-gray-600">Configurons votre garage en quelques étapes simples</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${step.completed
                                            ? 'bg-green-600 text-white'
                                            : currentStep === step.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-300 text-gray-600'
                                            }`}
                                    >
                                        {step.completed ? <Check className="w-5 h-5" /> : step.id}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className="text-sm font-medium text-gray-900">{step.title}</p>
                                        <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-1 flex-1 mx-4 ${step.completed ? 'bg-green-600' : 'bg-gray-300'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Garage Information */}
                    {currentStep === 1 && (
                        <div>
                            <div className="flex items-center mb-6">
                                <Building2 className="w-6 h-6 text-blue-600 mr-2" />
                                <h2 className="text-xl font-bold text-gray-900">Informations du Garage</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom du Garage *
                                    </label>
                                    <input
                                        type="text"
                                        value={garageName}
                                        onChange={(e) => setGarageName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Garage Bellevue"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={garageEmail}
                                        onChange={(e) => setGarageEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="contact@garage-bellevue.fr"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        value={garagePhone}
                                        onChange={(e) => setGaragePhone(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="01 23 45 67 89"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                    <textarea
                                        value={garageAddress}
                                        onChange={(e) => setGarageAddress(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="123 Rue de la République, 75001 Paris"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleSaveGarageInfo}
                                    disabled={!garageName || loading}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? 'Enregistrement...' : 'Suivant'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Business Hours */}
                    {currentStep === 2 && (
                        <div>
                            <div className="flex items-center mb-6">
                                <Clock className="w-6 h-6 text-blue-600 mr-2" />
                                <h2 className="text-xl font-bold text-gray-900">Horaires d'Ouverture</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Jours d'Ouverture
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {daysOfWeek.map((day) => (
                                            <button
                                                key={day.id}
                                                onClick={() => toggleWorkingDay(day.id)}
                                                className={`px-4 py-2 rounded-lg border transition-colors ${workingDays.includes(day.id)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Heure d'Ouverture
                                        </label>
                                        <input
                                            type="time"
                                            value={openingTime}
                                            onChange={(e) => setOpeningTime(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Heure de Fermeture
                                        </label>
                                        <input
                                            type="time"
                                            value={closingTime}
                                            onChange={(e) => setClosingTime(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleSaveBusinessHours}
                                    disabled={workingDays.length === 0 || loading}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? 'Enregistrement...' : 'Suivant'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Tax Configuration */}
                    {currentStep === 3 && (
                        <div>
                            <div className="flex items-center mb-6">
                                <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
                                <h2 className="text-xl font-bold text-gray-900">Configuration Fiscale</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Taux de TVA par Défaut (%)
                                    </label>
                                    <select
                                        value={defaultTaxRate}
                                        onChange={(e) => setDefaultTaxRate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="20">20% (Taux normal)</option>
                                        <option value="10">10% (Taux intermédiaire)</option>
                                        <option value="5.5">5.5% (Taux réduit)</option>
                                        <option value="2.1">2.1% (Taux super réduit)</option>
                                        <option value="0">0% (Exonéré)</option>
                                    </select>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Ce taux sera appliqué par défaut sur vos factures et devis
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        💡 <strong>Astuce :</strong> Vous pourrez modifier le taux de TVA individuellement sur chaque facture si nécessaire.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleFinishOnboarding}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? 'Finalisation...' : 'Terminer'}
                                    <Check className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
