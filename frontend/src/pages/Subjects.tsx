import { useState, useEffect } from 'react';
import {
    BookOpen, Users, Plus, Loader2, UserPlus, Layers, Trash2, Edit2, CheckCircle2
} from 'lucide-react';
import * as subjectApi from '../api/subject.api';
import * as gradeApi from '../api/grade.api';
import * as staffApi from '../api/staff.api';
import * as classroomApi from '../api/classroom.api';
import Modal from '../components/ui/Modal';
import { academicsApi } from '../api/academics.api';

export default function Subjects() {
    const [activeTab, setActiveTab] = useState<'list' | 'assignments'>('list');
    const [subjects, setSubjects] = useState<subjectApi.Subject[]>([]);
    const [assignments, setAssignments] = useState<subjectApi.Assignment[]>([]);
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);
    const [staff, setStaff] = useState<staffApi.Staff[]>([]);
    const [classrooms, setClassrooms] = useState<classroomApi.Classroom[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [subjectFormData, setSubjectFormData] = useState({
        name: '',
        code: '',
        grade_id: '',
        description: ''
    });

    const [assignFormData, setAssignFormData] = useState({
        staff_id: '',
        classroom_id: '',
        subject_id: '',
        academic_year_id: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subjectData, gradeData, staffData, classroomData, assignmentData, yearsData] = await Promise.all([
                subjectApi.getSubjectList(),
                gradeApi.getGrades(),
                staffApi.getStaffList({ limit: 100 }),
                classroomApi.getClassrooms(),
                subjectApi.getAssignments(),
                academicsApi.getYears()
            ]);
            setSubjects(subjectData);
            setGrades(gradeData);
            setStaff(staffData.data);
            setClassrooms(classroomData);
            setAssignments(assignmentData);

            if (yearsData && yearsData.length > 0) {
                const activeYear = yearsData.find((y: any) => y.is_current) || yearsData[0];
                setAssignFormData(prev => ({ ...prev, academic_year_id: activeYear.id.toString() }));
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await subjectApi.createSubject({
                ...subjectFormData,
                grade_id: parseInt(subjectFormData.grade_id)
            });
            await fetchData();
            setIsSubjectModalOpen(false);
            setSubjectFormData({ name: '', code: '', grade_id: '', description: '' });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAssignTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await subjectApi.assignTeacher({
                staff_id: parseInt(assignFormData.staff_id),
                classroom_id: parseInt(assignFormData.classroom_id),
                subject_id: parseInt(assignFormData.subject_id),
                academic_year_id: parseInt(assignFormData.academic_year_id)
            });
            await fetchData();
            setIsAssignModalOpen(false);
            setAssignFormData({ staff_id: '', classroom_id: '', subject_id: '', academic_year_id: '1' });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const colors = ['blue', 'indigo', 'amber', 'emerald', 'rose', 'purple'];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading tracking-tight">Academic Subjects</h1>
                    <p className="text-slate-500 text-sm mt-1">Define subjects per grade and assign teachers to classrooms.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsSubjectModalOpen(true)}
                        className="flex-1 sm:flex-none btn-primary"
                    >
                        <Plus size={16} />
                        New Subject
                    </button>
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <UserPlus size={16} />
                        Assign Teacher
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Layers size={16} />
                        Subject List
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('assignments')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'assignments' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Users size={16} />
                        Teacher Assignments
                    </div>
                </button>
            </div>

            {/* Main Content */}
            <div className="card">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={40} className="text-theme-primary animate-spin" />
                        <p className="text-slate-500 font-medium">Loading data...</p>
                    </div>
                ) : activeTab === 'list' ? (
                    <div className="overflow-x-auto">
                        {subjects?.length === 0 ? (
                            <EmptyState
                                icon={<BookOpen size={32} />}
                                title="No subjects defined"
                                description="Start by adding subjects to your grades."
                                buttonText="Add Subject"
                                onButtonClick={() => setIsSubjectModalOpen(true)}
                            />
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {subjects?.map((subject, i) => (
                                        <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white uppercase bg-${colors[i % colors.length]}-500 shadow-sm`}>
                                                        {subject.name[0]}
                                                    </div>
                                                    <div className="text-sm font-bold text-slate-800">{subject.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                                    {subject.grade_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-slate-600">
                                                {subject.code}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">
                                                {subject.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {assignments?.length === 0 ? (
                            <EmptyState
                                icon={<Users size={32} />}
                                title="No teacher assignments"
                                description="Assign teachers to subjects for specific classrooms."
                                buttonText="Assign Teacher"
                                onButtonClick={() => setIsAssignModalOpen(true)}
                            />
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Classroom</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assignments?.map((asgn) => (
                                        <tr key={asgn.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                        {asgn.teacher_name[0]}
                                                    </div>
                                                    <div className="text-sm font-bold text-slate-800">{asgn.teacher_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700">{asgn.subject_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700">{asgn.classroom_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                                                    <CheckCircle2 size={14} />
                                                    Assigned
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Create New Subject">
                <form onSubmit={handleAddSubject} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</label>
                            <input
                                required
                                className="input-field"
                                value={subjectFormData.name}
                                onChange={e => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                                placeholder="e.g. Mathematics"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</label>
                            <select
                                required
                                className="input-field"
                                value={subjectFormData.grade_id}
                                onChange={e => setSubjectFormData({ ...subjectFormData, grade_id: e.target.value })}
                            >
                                <option value="">Select Grade</option>
                                {grades.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Code</label>
                        <input
                            required
                            className="input-field font-mono"
                            value={subjectFormData.code}
                            onChange={e => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                            placeholder="e.g. MATH101"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <textarea
                            className="input-field h-24"
                            value={subjectFormData.description}
                            onChange={e => setSubjectFormData({ ...subjectFormData, description: e.target.value })}
                            placeholder="Optional subject details..."
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Create Subject'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Teacher to Subject">
                <form onSubmit={handleAssignTeacher} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</label>
                        <select
                            required
                            className="input-field"
                            value={assignFormData.staff_id}
                            onChange={e => setAssignFormData({ ...assignFormData, staff_id: e.target.value })}
                        >
                            <option value="">Select Teacher</option>
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classroom</label>
                            <select
                                required
                                className="input-field"
                                value={assignFormData.classroom_id}
                                onChange={e => setAssignFormData({ ...assignFormData, classroom_id: e.target.value })}
                            >
                                <option value="">Select Classroom</option>
                                {classrooms.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                            <select
                                required
                                className="input-field"
                                value={assignFormData.subject_id}
                                onChange={e => setAssignFormData({ ...assignFormData, subject_id: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.grade_name})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Assign Now'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function EmptyState({ icon, title, description, buttonText, onButtonClick }: any) {
    return (
        <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-slate-500 max-w-sm mb-6">{description}</p>
            <button onClick={onButtonClick} className="btn-primary">
                {buttonText}
            </button>
        </div>
    );
}
