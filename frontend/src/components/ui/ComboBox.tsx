import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface ComboBoxProps {
    options: Option[];
    value?: string | number | null;
    onChange: (value: string | number | null) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
    error?: string;
    variant?: 'outline' | 'glass';
    direction?: 'up' | 'down';
}

export const ComboBox: React.FC<ComboBoxProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option...',
    label,
    className = '',
    disabled = false,
    error,
    variant = 'outline',
    direction = 'down',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = useMemo(
        () => options.find(opt => opt.value === value),
        [options, value]
    );

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {label && (
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1 ${variant === 'glass' ? 'text-white/40' : 'text-slate-500'}`}>
                    {label}
                </label>
            )}
            
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    group flex items-center justify-between w-full px-4 py-3 
                    rounded-2xl cursor-pointer transition-all duration-200 border
                    ${variant === 'glass' 
                        ? 'bg-white/10 border-white/15 text-white' 
                        : 'bg-white border-slate-200 text-slate-700'}
                    ${isOpen ? (variant === 'glass' ? 'border-primary ring-4 ring-primary/20' : 'border-primary ring-4 ring-primary/5') : (variant === 'glass' ? 'hover:bg-white/15' : 'hover:border-slate-300')}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
                    ${error ? 'border-red-500 ring-4 ring-red-500/5' : ''}
                `}
            >
                <span className={`text-sm truncate ${!selectedOption ? (variant === 'glass' ? 'text-white/30' : 'text-slate-400') : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${variant === 'glass' ? 'text-white/30' : 'text-slate-400'}`} />
            </div>

            {isOpen && (
                <div className={`
                    absolute z-50 w-full rounded-2xl shadow-2xl overflow-hidden animate-scale-in border
                    ${direction === 'up' ? 'bottom-full mb-2 origin-bottom' : 'mt-2 origin-top'}
                    ${variant === 'glass' ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-700'}
                `}>
                    <div className={`p-2 border-b ${variant === 'glass' ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
                        <div className="relative flex items-center">
                            <Search className={`absolute left-3 w-4 h-4 ${variant === 'glass' ? 'text-white/20' : 'text-slate-400'}`} />
                            <input
                                autoFocus
                                type="text"
                                className={`
                                    w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none transition-all
                                    ${variant === 'glass' 
                                        ? 'bg-white/10 border-white/10 text-white focus:ring-2 focus:ring-primary/40 focus:border-primary' 
                                        : 'bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary'}
                                `}
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors
                                        ${value === option.value 
                                            ? (variant === 'glass' ? 'bg-primary/20 text-primary font-bold' : 'bg-primary/5 text-primary font-bold')
                                            : (variant === 'glass' ? 'text-white/70 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-50')}
                                    `}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && <Check className="w-4 h-4" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <Search className={`w-8 h-8 mx-auto mb-2 ${variant === 'glass' ? 'text-white/10' : 'text-slate-200'}`} />
                                <p className={`text-sm ${variant === 'glass' ? 'text-white/30' : 'text-slate-400'}`}>No results found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="mt-1.5 ml-1 text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
};
