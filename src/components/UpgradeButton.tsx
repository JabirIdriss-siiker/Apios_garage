import { ArrowUpCircle, Sparkles, AlertCircle } from 'lucide-react';

interface UpgradeButtonProps {
    message?: string;
    variant?: 'primary' | 'secondary';
}

export default function UpgradeButton({
    message = "Limite atteinte",
    variant = 'primary'
}: UpgradeButtonProps) {
    const handleClick = () => {
        // Navigate to settings page - will be implemented when settings page exists
        window.location.hash = '#settings';
    };

    if (variant === 'secondary') {
        return (
            <button
                onClick={handleClick}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
                <Sparkles className="w-4 h-4" />
                <span>Passer au plan supérieur</span>
            </button>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl">
            <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{message}</span>
            </div>

            <button
                onClick={handleClick}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
                <ArrowUpCircle className="w-5 h-5" />
                <span>Voir les offres</span>
            </button>

            <p className="text-xs text-slate-600 text-center">
                Passez à un plan supérieur pour débloquer plus de fonctionnalités
            </p>
        </div>
    );
}
