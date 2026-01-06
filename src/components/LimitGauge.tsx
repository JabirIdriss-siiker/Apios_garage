import { AlertCircle } from 'lucide-react';

interface LimitGaugeProps {
    label: string;
    used: number;
    max: number;
    unit?: string;
}

export default function LimitGauge({ label, used, max, unit = '' }: LimitGaugeProps) {
    const percentage = max > 0 ? (used / max) * 100 : 0;
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    const getColor = () => {
        if (isAtLimit) return 'bg-red-500';
        if (isNearLimit) return 'bg-orange-500';
        return 'bg-green-500';
    };

    const getTextColor = () => {
        if (isAtLimit) return 'text-red-700';
        if (isNearLimit) return 'text-orange-700';
        return 'text-slate-700';
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className={`text-sm font-semibold ${getTextColor()}`}>
                    {used} / {max} {unit}
                </span>
            </div>

            <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor()} transition-all duration-300 rounded-full`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            {isAtLimit && (
                <div className="flex items-center gap-2 text-xs text-red-600 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Limite atteinte</span>
                </div>
            )}

            {isNearLimit && !isAtLimit && (
                <div className="flex items-center gap-2 text-xs text-orange-600 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Proche de la limite</span>
                </div>
            )}
        </div>
    );
}
