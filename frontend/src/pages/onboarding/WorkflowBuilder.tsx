import { useState } from 'react';
import { 
    Plus, Trash2, GripVertical, 
    Save, ShieldAlert
} from 'lucide-react';

const WorkflowBuilder = () => {
    const [steps] = useState([
        { id: 1, name: 'Personal Details', role: 'Applicant', type: 'Form', mandatory: true },
        { id: 2, name: 'Document Upload', role: 'Applicant', type: 'Document', mandatory: true },
        { id: 3, name: 'Academic Verification', role: 'Registrar', type: 'Approval', mandatory: true },
        { id: 4, name: 'Principal Interview', role: 'Principal', type: 'Meeting', mandatory: false },
    ]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Workflow Builder</h1>
                    <p className="text-sm text-slate-500 mt-1">Design customized onboarding sequences for your school</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium transition-all">
                        Discard
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all active:scale-95">
                        <Save size={18} />
                        Save Template
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Configuration Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Template Settings</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Template Name</label>
                                <input type="text" className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. Standard Admission" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Apply To</label>
                                <select className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                                    <option>Students</option>
                                    <option>Teachers</option>
                                    <option>Support Staff</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                        <ShieldAlert size={24} className="mb-4 opacity-80" />
                        <h4 className="font-bold mb-2">Architect Tip</h4>
                        <p className="text-xs opacity-80 leading-relaxed">
                            Dynamic workflows allow you to enforce compliance before a record is officially created in the system.
                        </p>
                    </div>
                </div>

                {/* Steps List */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Onboarding Steps</h3>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {steps.length} STEPS DEFINED
                        </span>
                    </div>

                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <div key={step.id} className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary/50 transition-all shadow-sm">
                                <GripVertical className="text-slate-300 cursor-grab group-hover:text-slate-400" size={18} />
                                <div className="flex-grow grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Step {index + 1}</p>
                                        <input 
                                            type="text" 
                                            value={step.name}
                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0"
                                            readOnly
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Assigned To</p>
                                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full">{step.role}</span>
                                        </div>
                                        <button className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                        <Plus size={18} />
                        Add New Step
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkflowBuilder;
