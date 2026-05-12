import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader2, X } from 'lucide-react';

interface Option {
    id: string | number;
    label: string;
    sublabel?: string;
    original: any;
}

interface SearchableSelectProps {
    value?: string | number;
    onSelect: (option: Option) => void;
    onSearch: (query: string) => Promise<any[]>;
    placeholder: string;
    label?: string;
    icon?: any;
    formatOption: (item: any) => Option;
    compact?: boolean;
}

export default function SearchableSelect({ 
    value: _value,
    onSelect, 
    onSearch, 
    placeholder, 
    label, 
    icon: Icon,
    formatOption,
    compact = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        
        const delayDebounceFn = setTimeout(async () => {
            try {
                setLoading(true);
                const results = await onSearch(query);
                setOptions(results.map(formatOption));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, isOpen]);

    const handleSelect = (option: Option) => {
        setSelectedLabel(option.label);
        onSelect(option);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div className="relative space-y-2" ref={dropdownRef}>
            {label && (
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {Icon && <Icon size={12} />} {label}
                </label>
            )}
            
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left transition-all flex items-center justify-between
                    ${compact 
                        ? `px-3 py-2 bg-transparent border border-transparent rounded-lg text-sm font-bold ${selectedLabel ? 'text-slate-800' : 'text-slate-400'} hover:bg-white/50 focus:border-primary focus:bg-white` 
                        : `px-5 py-4 bg-slate-50 border rounded-2xl ${selectedLabel ? 'text-slate-800' : 'text-slate-400'} ${isOpen ? 'border-primary ring-4 ring-primary/5 bg-white' : 'border-slate-200 hover:border-slate-300'}`
                    }`}
            >
                <span className={`truncate ${compact ? 'max-w-[150px]' : ''}`}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown size={compact ? 14 : 20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute z-[100] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200
                    ${compact ? 'top-full min-w-[300px]' : 'top-full mt-2'}`}>
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                autoFocus
                                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary transition-all"
                                placeholder="Start typing to search..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                            {query && (
                                <button 
                                    onClick={() => setQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center flex flex-col items-center gap-2">
                                <Loader2 size={24} className="animate-spin text-primary" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Searching...</p>
                            </div>
                        ) : options.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm font-bold text-slate-400">No results found</p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {options.map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className="w-full p-4 text-left hover:bg-slate-50 rounded-xl transition-all group flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{option.label}</p>
                                            {option.sublabel && <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{option.sublabel}</p>}
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronDown size={16} className="-rotate-90 text-primary" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
