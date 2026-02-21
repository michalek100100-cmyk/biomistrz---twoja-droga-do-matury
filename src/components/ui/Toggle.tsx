// src/components/ui/Toggle.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ToggleProps {
    label: string;
    description?: string;
    icon?: LucideIcon;
    active: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
    label,
    description,
    icon: Icon,
    active,
    onToggle,
    disabled = false
}) => {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50  rounded-2xl mb-3 border border-gray-100 ">
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className={`p-3 rounded-xl transition-colors ${active
                            ? 'bg-blue-100 text-blue-600  '
                            : 'bg-gray-200 text-gray-500  '
                        }`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
                <div>
                    <h4 className="font-bold text-gray-800 ">{label}</h4>
                    {description && (
                        <p className="text-xs text-gray-500 ">{description}</p>
                    )}
                </div>
            </div>
            <button
                onClick={onToggle}
                disabled={disabled}
                className={`
          w-14 h-8 rounded-full flex items-center p-1 transition-all duration-300
          ${active ? 'bg-blue-600' : 'bg-gray-300 '}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <div className={`
          w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300
          ${active ? 'translate-x-6' : 'translate-x-0'}
        `} />
            </button>
        </div>
    );
};

export default Toggle;
