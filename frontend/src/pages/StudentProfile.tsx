import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ChevronLeft, GraduationCap, Map, 
    CheckCircle2, Circle, Clock, 
    Calendar, Phone, MapPin,
    Award, TrendingUp, Loader2
} from 'lucide-react';
import * as studentApi from '../api/student.api';
import * as gradeApi from '../api/grade.api';

export default function StudentProfile() {
    const { id } = useParams<{ id: string }>();
    const [student, setStudent] = useState<any>(null);
    const [grades, setGrades] = useState<gradeApi.Grade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentData, gradesData] = await Promise.all([
                    studentApi.getStudentProfile(parseInt(id!)),
                    gradeApi.getGrades()
                ]);
                setStudent(studentData);
                setGrades(gradesData.sort((a, b) => a.sequence_order - b.sequence_order));
            } catch (err) {
                console.error('Failed to fetch profile data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 size={48} className="text-theme-primary animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Assembling Academic Profile...</p>
            </div>
        );
    }

    if (!student) return <div>Student not found</div>;

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Breadcrumbs & Navigation */}
            <div className="flex items-center gap-4">
                <Link to="/students" className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Student Profile</h2>
                    <p className="text-lg font-bold text-slate-800">{student.first_name} {student.last_name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="card p-8 bg-white border-slate-100 shadow-xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-400 border-4 border-white shadow-2xl">
                                    {student.first_name[0]}{student.last_name?.[0]}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-theme-primary text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white">
                                    <Award size={20} />
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">{student.first_name} {student.last_name}</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{student.admission_no}</p>
                            </div>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest">
                                <CheckCircle2 size={14} />
                                Active Enrollment
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-4 text-slate-600">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Grade</p>
                                    <p className="text-sm font-bold text-slate-800">{student.current_grade_name || 'Not Assigned'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Classroom</p>
                                    <p className="text-sm font-bold text-slate-800">{student.classroom_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-8 bg-white border-slate-100 shadow-sm space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Contact & Personal</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Phone size={16} className="text-slate-300" />
                                <span className="text-sm font-medium">{student.phone || 'No phone added'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Calendar size={16} className="text-slate-300" />
                                <span className="text-sm font-medium">Born: {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-600">
                                <MapPin size={16} className="text-slate-300 mt-1" />
                                <span className="text-sm font-medium leading-relaxed">{student.address || 'Address not provided'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Academic Journey */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="card p-10 bg-white border-slate-100 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-12">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    <TrendingUp size={14} />
                                    Growth Trajectory
                                </div>
                                <h3 className="text-3xl font-black text-slate-800 leading-none">Academic <span className="text-indigo-600">Journey</span></h3>
                                <p className="text-slate-400 text-sm font-medium">Visualization of passed, current, and future academic milestones.</p>
                            </div>
                        </div>

                        {/* Progression Roadmap */}
                        <div className="relative flex flex-col gap-12 pl-8">
                            {/* Vertical Line Container */}
                            <div className="absolute top-0 bottom-0 left-12 w-0.5 bg-slate-100" />

                            {grades.map((grade) => {
                                const isPassed = grade.sequence_order < (student.current_grade_sequence || 0);
                                const isCurrent = grade.id === student.current_grade_id;

                                return (
                                    <div key={grade.id} className={`group relative flex items-start gap-12 transition-all ${isPassed ? 'opacity-60' : 'opacity-100'}`}>
                                        {/* Status Icon */}
                                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-all ${
                                            isPassed ? 'bg-emerald-500 text-white' : 
                                            isCurrent ? 'bg-indigo-600 text-white scale-125 ring-4 ring-indigo-100' : 
                                            'bg-white text-slate-200 border-slate-100'
                                        }`}>
                                            {isPassed ? <CheckCircle2 size={16} /> : isCurrent ? <Map size={16} /> : <Circle size={16} />}
                                        </div>

                                        {/* Content Card */}
                                        <div className={`flex-1 p-6 rounded-3xl border transition-all ${
                                            isCurrent ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xl shadow-indigo-200 -translate-y-2' : 
                                            'bg-slate-50/50 border-slate-100'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                        {isPassed ? 'Completed Level' : isCurrent ? 'Active Level' : 'Upcoming Milestone'}
                                                    </p>
                                                    <h4 className="text-xl font-black">{grade.name}</h4>
                                                </div>
                                                {isPassed && (
                                                    <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                        Passed
                                                    </div>
                                                )}
                                                {isCurrent && (
                                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
                                                        <Clock size={20} />
                                                    </div>
                                                )}
                                            </div>

                                            {isCurrent && (
                                                <div className="mt-6 grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-white/10 rounded-2xl">
                                                        <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest mb-1">Subjects</p>
                                                        <p className="text-lg font-black leading-none">Core Curriculum</p>
                                                    </div>
                                                    <div className="p-3 bg-white/10 rounded-2xl">
                                                        <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest mb-1">Status</p>
                                                        <p className="text-lg font-black leading-none">In Progress</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
