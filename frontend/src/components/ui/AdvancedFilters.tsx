import React, { useState } from 'react';
import { X, Filter, ChevronDown, RotateCcw } from 'lucide-react';

export interface FilterField {
    id: string;
    label: string;
    type: 'text' | 'select' | 'date';
    options?: { value: string | number; label: string }[];
    placeholder?: string;
}

interface AdvancedFiltersProps {
    fields: FilterField[];
    onFilter: (filters: any) => void;
    onReset: () => void;
    currentFilters: any;
    isOpen: boolean;
    onClose: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    fields,
    onFilter,
    onReset,
    currentFilters,
    isOpen,
    onClose
}) => {
    const [localFilters, setLocalFilters] = useState(currentFilters);

    if (!isOpen) return null;

    const handleApply = () => {
        onFilter(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({});
        onReset();
        onClose();
    };

    return (
        <div className="absolute top-full right-0 mt-4 w-[400px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 z-[100] p-8 animate-in zoom-in-95 slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg">
                        <Filter size={18} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Advanced Search</h3>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-6">
                {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                            {field.label}
                        </label>
                        
                        {field.type === 'select' ? (
                            <div className="relative group">
                                <select
                                    className="w-full pl-5 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-primary/30 outline-none transition-all cursor-pointer"
                                    value={localFilters[field.id] || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, [field.id]: e.target.value })}
                                >
                                    <option value="">All {field.label}</option>
                                    {field.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={16} />
                            </div>
                        ) : field.type === 'date' ? (
                            <input
                                type="date"
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-primary/30 outline-none transition-all"
                                value={localFilters[field.id] || ''}
                                onChange={(e) => setLocalFilters({ ...localFilters, [field.id]: e.target.value })}
                            />
                        ) : (
                            <input
                                type="text"
                                placeholder={field.placeholder}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-primary/30 outline-none transition-all placeholder:text-slate-300"
                                value={localFilters[field.id] || ''}
                                onChange={(e) => setLocalFilters({ ...localFilters, [field.id]: e.target.value })}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-slate-50">
                <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-3 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
                >
                    <RotateCcw size={14} />
                    Reset All
                </button>
                <button
                    onClick={handleApply}
                    className="flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

export default AdvancedFilters;
