import { useState, useEffect } from 'react';
import { 
    FileText, Video, Link as LinkIcon, 
    Search, Plus, Download, 
    MoreVertical, BookOpen,
    LayoutGrid, List as ListIcon,
    File as FileIcon, ExternalLink
} from 'lucide-react';
import { get } from '../../api/base.api';
import { useAuth } from '../../contexts/AuthContext';

export default function LMSLibrary() {
    const { can } = useAuth();
    const canWrite = can('assignment:write');
    
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const data = await get<any[]>('/school/homework/lms/library');
            setResources(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             r.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'All' || r.resource_type === selectedType.toLowerCase();
        return matchesSearch && matchesType;
    });

    const getIcon = (type: string) => {
        switch(type) {
            case 'pdf': return <FileText className="text-rose-500" />;
            case 'video': return <Video className="text-amber-500" />;
            case 'link': return <LinkIcon className="text-sky-500" />;
            default: return <FileIcon className="text-slate-500" />;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Digital Library</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Knowledge & Resource Repository</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                    {canWrite && (
                        <button className="btn-primary">
                            <Plus size={18} /> Add Resource
                        </button>
                    )}
                </div>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search resources, titles, tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {['All', 'PDF', 'Video', 'Link', 'Doc'].map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                selectedType === type 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Knowledge Hub...</div>
            ) : filteredResources.length === 0 ? (
                <div className="p-20 bg-white rounded-[3rem] border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">No Resources Found</h2>
                    <p className="text-slate-400 mt-1 font-medium italic">"Knowledge shared is knowledge multiplied." — Be the first to share!</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((res, idx) => (
                        <div 
                            key={res.id} 
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 transition-colors">
                                    {getIcon(res.resource_type)}
                                </div>
                                <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2 group-hover:text-primary transition-colors">{res.title}</h3>
                                <p className="text-slate-400 text-xs font-medium line-clamp-2 leading-relaxed mb-6">{res.description}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {res.tags?.map((tag: string) => (
                                        <span key={tag} className="px-3 py-1 bg-slate-50 text-[9px] font-black uppercase text-slate-400 rounded-lg border border-slate-100">
                                            #{tag}
                                        </span>
                                    ))}
                                    {res.subject_name && (
                                        <span className="px-3 py-1 bg-emerald-50 text-[9px] font-black uppercase text-emerald-600 rounded-lg border border-emerald-100">
                                            {res.subject_name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                        {res.resource_type.slice(0, 1).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {new Date(res.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <a 
                                    href={res.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                >
                                    {res.resource_type === 'link' ? <ExternalLink size={16} /> : <Download size={16} />}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredResources.map(res => (
                                <tr key={res.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                                {getIcon(res.resource_type)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{res.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-xs">{res.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{res.resource_type}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1.5 bg-emerald-50 text-[9px] font-black uppercase text-emerald-600 rounded-lg">
                                            {res.subject_name || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(res.created_at).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-300 hover:text-primary transition-colors">
                                                <Download size={18} />
                                            </a>
                                            <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
