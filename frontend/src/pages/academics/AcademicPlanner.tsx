import { useState, useEffect } from 'react';
import { 
    BookOpen, Clock, Target, Plus, 
    AlertTriangle, Sparkles, Loader2, Play, Check, 
    TrendingUp, CalendarRange, CheckCircle2,
    ArrowLeft, Search, ChevronLeft, ChevronRight, Globe,
    ArrowUp, ArrowDown, Trash2, Edit
} from 'lucide-react';
import { get, post, put, del } from '../../api/base.api';
import { useAuth } from '../../contexts/AuthContext';

const GLOBAL_BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];
const GLOBAL_GRADES = [
    'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 
    'Grade 10', 'Grade 11', 'Grade 12'
];
const GLOBAL_SUBJECTS = [
    'English', 'Mathematics', 'Science', 'Social Science', 
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 
    'Environmental Studies (EVS)', 'Hindi', 'Sanskrit'
];

const getStandardGradeName = (name: string): string => {
    if (!name) return '';
    const lower = name.toLowerCase().trim();
    
    if (/\b(lkg|l\.k\.g|lower kindergarten)\b/.test(lower)) return 'Kindergarten';
    if (/\b(ukg|u\.k\.g|upper kindergarten)\b/.test(lower)) return 'Kindergarten';
    if (/\b(kindergarten|nursery)\b/.test(lower)) return 'Kindergarten';

    const romanMap: { [key: string]: string } = {
        'xii': '12', 'xi': '11', 'x': '10', 'ix': '9', 'viii': '8',
        'vii': '7', 'vi': '6', 'v': '5', 'iv': '4', 'iii': '3', 'ii': '2', 'i': '1'
    };
    
    for (const r of Object.keys(romanMap)) {
        const regex = new RegExp(`\\b${r}\\b`, 'i');
        if (regex.test(lower)) {
            return `Grade ${romanMap[r]}`;
        }
    }

    const wordMap: { [key: string]: string } = {
        'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5',
        'sixth': '6', 'seventh': '7', 'eighth': '8', 'ninth': '9', 'tenth': '10',
        'eleventh': '11', 'twelfth': '12', 'one': '1', 'two': '2', 'three': '3',
        'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
    };
    for (const w of Object.keys(wordMap)) {
        if (lower.includes(w)) {
            return `Grade ${wordMap[w]}`;
        }
    }

    const digitMatch = lower.match(/\b\d+\b/) || lower.match(/\d+/);
    if (digitMatch) {
        return `Grade ${digitMatch[0]}`;
    }

    return '';
};

const getStandardSubjectName = (name: string): string => {
    if (!name) return '';
    const lower = name.toLowerCase().trim();
    
    if (lower.includes('eng')) return 'English';
    if (lower.includes('math') || lower.includes('mat')) return 'Mathematics';
    if (lower.includes('phy')) return 'Physics';
    if (lower.includes('chem')) return 'Chemistry';
    if (lower.includes('bio')) return 'Biology';
    if (lower.includes('sci')) return 'Science';
    if (lower.includes('computer') || lower.includes('comp') || lower.includes('cs') || lower.includes('ict')) return 'Computer Science';
    if (lower.includes('social') || lower.includes('sst') || lower.includes('hist') || lower.includes('geog') || lower.includes('civ')) return 'Social Science';
    
    return '';
};

export default function AcademicPlanner() {
    const { user } = useAuth();
    const isTeacher = user?.roles?.includes('teacher') || user?.roles?.includes('staff');

    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);

    // Filter states
    const [selectedYearId, setSelectedYearId] = useState<string>('');
    const [selectedGradeId, setSelectedGradeId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');

    // Planner details
    const [planner, setPlanner] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [isGeneratingSmart, setIsGeneratingSmart] = useState(false);
    const [activeTab, setActiveTab] = useState<'chapters' | 'milestones' | 'smart' | 'manual-schedule'>('chapters');
    const [smartPlan, setSmartPlan] = useState<any | null>(null);
    const [loadingSmartPlan, setLoadingSmartPlan] = useState(false);

    // Manual Period Scheduler States
    const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
    const [lessonPlansList, setLessonPlansList] = useState<any[]>([]);
    const [loadingManualPlanner, setLoadingManualPlanner] = useState(false);
    const [holidaysList, setHolidaysList] = useState<any[]>([]);
    const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

    // Modals
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);

    // Dynamic filter options
    const [boards, setBoards] = useState<string[]>(GLOBAL_BOARDS);
    const [gradesList, setGradesList] = useState<string[]>(GLOBAL_GRADES);
    const [subjectsList, setSubjectsList] = useState<string[]>(GLOBAL_SUBJECTS);

    // Editing states
    const [editingChapter, setEditingChapter] = useState<any | null>(null);
    const [editChapterForm, setEditChapterForm] = useState({
        name: '',
        description: '',
        estimated_lessons: 5,
        start_date: '',
        end_date: '',
        status: 'pending'
    });

    const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
    const [editTopicTitle, setEditTopicTitle] = useState<string>('');
    const [newTopicTitles, setNewTopicTitles] = useState<{[chapterId: number]: string}>({});

    const handleAddTopic = async (chapterId: number, e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const title = newTopicTitles[chapterId]?.trim();
        if (!title) return;
        try {
            await post(`/school/planners/chapters/${chapterId}/topics`, { title, description: '' });
            setNewTopicTitles(prev => ({ ...prev, [chapterId]: '' }));
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to add topic');
        }
    };

    const handleUpdateTopic = async (topicId: number) => {
        const title = editTopicTitle.trim();
        if (!title) return;
        try {
            await put(`/school/planners/topics/${topicId}`, { title });
            setEditingTopicId(null);
            setEditTopicTitle('');
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to update topic');
        }
    };

    const handleDeleteTopic = async (topicId: number) => {
        if (!confirm("Are you sure you want to delete this topic?")) return;
        try {
            await del(`/school/planners/topics/${topicId}`);
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to delete topic');
        }
    };

    const handleMoveTopic = async (topicId: number, direction: 'up' | 'down') => {
        try {
            await post(`/school/planners/topics/${topicId}/move`, { direction });
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to move topic');
        }
    };

    const [editingSession, setEditingSession] = useState<any | null>(null);
    const [editSessionForm, setEditSessionForm] = useState({
        topic_title: '',
        scheduled_date: '',
        status: 'PLANNED',
        teacher_notes: ''
    });
    
    // View state & smart planner library states
    const [viewMode, setViewMode] = useState<'planner' | 'import-syllabus'>('planner');
    const [importSource, setImportSource] = useState<'planner' | 'smart' | 'init'>('planner');
    const [libraryTemplates, setLibraryTemplates] = useState<any[]>([]);
    const [libraryTotal, setLibraryTotal] = useState(0);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [showRelaxedAlert, setShowRelaxedAlert] = useState(false);
    const [selectedPreviewTemplateId, setSelectedPreviewTemplateId] = useState<number | null>(null);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [libraryFilters, setLibraryFilters] = useState({
        board: '',
        grade: '',
        subject: '',
        search: '',
        page: 1,
        limit: 6
    });

    // Form inputs
    const [initData, setInitData] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
    });

    const [chapterData, setChapterData] = useState({
        name: '',
        description: '',
        estimated_lessons: 5
    });

    const [milestoneData, setMilestoneData] = useState({
        name: '',
        target_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        loadTaxonomy();
    }, []);

    useEffect(() => {
        loadMetadata(selectedYearId);
    }, [selectedYearId]);

    const loadTaxonomy = async () => {
        try {
            const data = await get<any>('/school/planners/smart/taxonomy');
            if (data) {
                if (data.boards?.length > 0) setBoards(data.boards);
                if (data.grades?.length > 0) setGradesList(data.grades);
                if (data.subjects?.length > 0) setSubjectsList(data.subjects);
            }
        } catch (err) {
            console.error('Failed to load global taxonomy, using fallback lists.', err);
        }
    };

    const openEditChapterModal = (ch: any) => {
        setEditingChapter(ch);
        setEditChapterForm({
            name: ch.name || '',
            description: ch.description || '',
            estimated_lessons: ch.estimated_lessons || 1,
            start_date: ch.start_date ? new Date(ch.start_date).toISOString().split('T')[0] : '',
            end_date: ch.end_date ? new Date(ch.end_date).toISOString().split('T')[0] : '',
            status: ch.status || 'pending'
        });
    };

    const handleUpdateChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChapter) return;
        try {
            await put(`/school/planners/chapters/${editingChapter.id}`, editChapterForm);
            setEditingChapter(null);
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to update chapter');
        }
    };

    const handleDeleteChapter = async (chapterId: number) => {
        if (!confirm("Are you sure you want to delete this chapter? This cannot be undone.")) return;
        try {
            const details = await del<any>(`/school/planners/chapters/${chapterId}`);
            setPlanner(details);
        } catch (err: any) {
            alert(err.message || 'Failed to delete chapter');
        }
    };

    const handleMoveChapter = async (chapterId: number, direction: 'up' | 'down') => {
        try {
            const details = await post<any>(`/school/planners/chapters/${chapterId}/move`, { direction });
            setPlanner(details);
        } catch (err: any) {
            alert(err.message || 'Failed to move chapter');
        }
    };

    const openEditSessionModal = (session: any) => {
        setEditingSession(session);
        setEditSessionForm({
            topic_title: session.topic || '',
            scheduled_date: session.raw_date || '',
            status: session.status || 'PLANNED',
            teacher_notes: session.notes || ''
        });
    };

    const handleUpdateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSession) return;
        try {
            await put(`/school/planners/smart/sessions/${editingSession.id}`, editSessionForm);
            setEditingSession(null);
            loadSmartPlan();
        } catch (err: any) {
            alert(err.message || 'Failed to update session');
        }
    };

    useEffect(() => {
        if (selectedYearId && selectedGradeId && selectedSubjectId && selectedTeacherId && selectedClassroomId) {
            loadPlanner();
        } else {
            setPlanner(null);
        }
    }, [selectedYearId, selectedGradeId, selectedSubjectId, selectedTeacherId, selectedClassroomId]);

    const loadMetadata = async (yearId?: string) => {
        try {
            let currentYearId = yearId || selectedYearId;
            let yearsList = academicYears;

            if (yearsList.length === 0) {
                const yearsData = await get<any>('/school/academics/years');
                yearsList = Array.isArray(yearsData) ? yearsData : (yearsData?.data || yearsData?.items || []);
                setAcademicYears(yearsList);
            }

            if (!currentYearId) {
                const activeYear = yearsList.find((y: any) => y.status === 'active');
                if (activeYear) {
                    currentYearId = activeYear.id.toString();
                    setSelectedYearId(currentYearId);
                    return;
                }
            }

            const queryParams = currentYearId ? `&academic_year_id=${currentYearId}` : '';

            const [gradesData, subjectsData, staffData, classroomsData] = await Promise.all([
                get<any>(`/school/grades?limit=100${queryParams}`),
                get<any>(`/school/subjects?limit=100${queryParams}`),
                get<any>(`/school/staff?limit=300${queryParams}`),
                get<any>(`/school/classrooms?limit=100${queryParams}`).catch(() => ({ data: [] }))
            ]);

            const gradesList = Array.isArray(gradesData) ? gradesData : (gradesData?.data || gradesData?.items || []);
            const subjectsList = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.data || subjectsData?.items || []);
            const staffList = Array.isArray(staffData) ? staffData : (staffData?.data || staffData?.items || []);
            const classroomsList = Array.isArray(classroomsData) ? classroomsData : (classroomsData?.data || classroomsData?.items || []);

            setGrades(gradesList);
            setSubjects(subjectsList);
            setTeachers(staffList.filter((s: any) => s.designation?.toLowerCase().includes('teacher') || s.role?.toLowerCase() === 'teacher' || true));
            setClassrooms(classroomsList);

            // If user is teacher, lock their teacher ID selection
            if (isTeacher && user?.sub) {
                // Find matching staff record for logged-in user
                const matchingStaff = staffList.find((s: any) => s.user_id?.toString() === user.sub?.toString());
                if (matchingStaff) {
                    setSelectedTeacherId(matchingStaff.id.toString());
                }
            }
        } catch (err) {
            console.error('Failed to load metadata', err);
        }
    };

    const loadSmartPlan = async () => {
        if (!selectedClassroomId || !selectedSubjectId) {
            setSmartPlan(null);
            return;
        }
        setLoadingSmartPlan(true);
        try {
            const data = await get<any>(`/school/planners/smart?classroom_id=${selectedClassroomId}&subject_id=${selectedSubjectId}`);
            setSmartPlan(data);
        } catch (err) {
            console.error('Failed to load smart plan', err);
            setSmartPlan(null);
        } finally {
            setLoadingSmartPlan(false);
        }
    };

    const loadManualPlannerDetails = async () => {
        if (!selectedClassroomId || !selectedSubjectId || !selectedTeacherId || !selectedYearId) return;
        setLoadingManualPlanner(true);
        try {
            const currentYearObj = academicYears.find(y => y.id.toString() === selectedYearId);
            const startStr = currentYearObj?.start_date?.split('T')[0] || '2026-04-01';
            const endStr = currentYearObj?.end_date?.split('T')[0] || '2027-03-31';

            const [timetableData, lessonsData, eventsRes] = await Promise.all([
                get<any[]>(`/school/timetable/classroom/${selectedClassroomId}`),
                get<any[]>(`/school/planners/lessons?staff_id=${selectedTeacherId}&start_date=${startStr}&end_date=${endStr}`),
                get<any[]>('/school/events').catch(() => [])
            ]);

            // Filter timetable for this subject and active days
            const classTimetable = (Array.isArray(timetableData) ? timetableData : (timetableData as any)?.data || [])
                .filter((t: any) => t.subject_id.toString() === selectedSubjectId.toString() && !t.is_deleted);
            
            setTimetableEntries(classTimetable);
            setLessonPlansList(Array.isArray(lessonsData) ? lessonsData : (lessonsData as any)?.data || []);
            setHolidaysList((Array.isArray(eventsRes) ? eventsRes : (eventsRes as any)?.data || []).filter((e: any) => e.event_type === 'holiday'));
        } catch (err) {
            console.error('Failed to load manual planner details', err);
        } finally {
            setLoadingManualPlanner(false);
        }
    };

    const handleAssignTopicToSlot = async (topic: { topicId: number, chapterId: number, title: string }, dateStr: string, startTime: string) => {
        try {
            const payload = {
                staff_id: parseInt(selectedTeacherId),
                classroom_id: parseInt(selectedClassroomId),
                subject_id: parseInt(selectedSubjectId),
                planner_chapter_id: topic.chapterId,
                planner_topic_id: topic.topicId,
                scheduled_date: dateStr,
                period_start_time: startTime,
                topic_title: topic.title,
                status: 'PLANNED'
            };
            await post('/school/planners/lessons', payload);
            loadManualPlannerDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to assign topic');
        }
    };

    const handleUnassignSlot = async (lp: any) => {
        try {
            const payload = {
                staff_id: parseInt(selectedTeacherId),
                classroom_id: parseInt(selectedClassroomId),
                subject_id: parseInt(selectedSubjectId),
                planner_chapter_id: null,
                planner_topic_id: null,
                scheduled_date: lp.scheduled_date.split('T')[0],
                period_start_time: lp.period_start_time,
                topic_title: '',
                teaching_notes: '',
                status: 'PLANNED'
            };
            await post('/school/planners/lessons', payload);
            loadManualPlannerDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to unassign topic');
        }
    };

    const getUpcomingPeriods = (timetableEntries: any[], holidays: any[], limitWeeks = 6) => {
        const list: any[] = [];
        const today = new Date();
        const termStart = planner ? new Date(planner.start_date) : today;
        let curr = new Date(Math.max(today.getTime(), termStart.getTime()));
        const endLimit = new Date(curr.getTime() + limitWeeks * 7 * 24 * 3600 * 1000);
        
        const sortedSlots = [...timetableEntries].sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
            return a.start_time.localeCompare(b.start_time);
        });

        while (curr <= endLimit) {
            const dayOfWeek = curr.getDay() === 0 ? 7 : curr.getDay(); // 0 is Sunday, map Sunday to 7
            
            const dateStr = curr.toISOString().split('T')[0];
            const isHoliday = holidays.some((h: any) => {
                const hStart = h.start_date.split('T')[0];
                const hEnd = h.end_date.split('T')[0];
                return dateStr >= hStart && dateStr <= hEnd;
            });

            if (!isHoliday) {
                const slotsForDay = sortedSlots.filter(s => s.day_of_week === dayOfWeek);
                for (const slot of slotsForDay) {
                    list.push({
                        date: dateStr,
                        dayName: curr.toLocaleDateString('en-US', { weekday: 'short' }),
                        formattedDate: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        time: slot.start_time,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        slotId: `${dateStr}_${slot.start_time}`
                    });
                }
            }
            curr.setDate(curr.getDate() + 1);
        }
        return list;
    };

    useEffect(() => {
        if (activeTab === 'smart') {
            loadSmartPlan();
        } else if (activeTab === 'manual-schedule') {
            loadManualPlannerDetails();
        }
    }, [selectedClassroomId, selectedSubjectId, selectedTeacherId, activeTab]);

    const loadPlanner = async () => {
        setLoading(true);
        try {
            const res = await get<any>(
                `/school/planners/by-teacher-subject?staff_id=${selectedTeacherId}&subject_id=${selectedSubjectId}&grade_id=${selectedGradeId}&academic_year_id=${selectedYearId}`
            );
            
            if (res) {
                const details = await get<any>(`/school/planners/${res.id}`);
                setPlanner(details);
            } else {
                setPlanner(null);
            }
        } catch (err) {
            console.error('Failed to load planner', err);
            setPlanner(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlanner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                academic_year_id: parseInt(selectedYearId),
                staff_id: parseInt(selectedTeacherId),
                subject_id: parseInt(selectedSubjectId),
                grade_id: parseInt(selectedGradeId),
                start_date: initData.start_date,
                end_date: initData.end_date
            };
            const created = await post<any>('/school/planners', payload);
            // Load full details
            const details = await get<any>(`/school/planners/${created.id}`);
            setPlanner(details);
        } catch (err: any) {
            alert(err.message || 'Failed to initialize academic planner');
        }
    };

    const handleAddChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!planner) return;
        try {
            await post(`/school/planners/${planner.id}/chapters`, chapterData);
            setShowChapterModal(false);
            setChapterData({ name: '', description: '', estimated_lessons: 5 });
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to add chapter');
        }
    };

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!planner) return;
        try {
            await post(`/school/planners/${planner.id}/milestones`, milestoneData);
            setShowMilestoneModal(false);
            setMilestoneData({ name: '', target_date: new Date().toISOString().split('T')[0], description: '' });
            loadPlanner();
        } catch (err: any) {
            alert(err.message || 'Failed to add milestone');
        }
    };

    const handleUpdateChapterStatus = async (chapterId: number, currentStatus: string) => {
        let nextStatus = 'pending';
        if (currentStatus === 'pending') nextStatus = 'in_progress';
        else if (currentStatus === 'in_progress') nextStatus = 'completed';

        try {
            await put(`/school/planners/chapters/${chapterId}`, { status: nextStatus });
            loadPlanner();
        } catch (err: any) {
            console.error('Failed to update status', err);
        }
    };

    const handleAutoSchedule = async () => {
        if (!planner) return;
        if (!confirm("This will automatically calculate and evenly schedule chapter completion dates based on lesson durations. Continue?")) return;
        
        try {
            const scheduled = await post<any>(`/school/planners/${planner.id}/auto-schedule`, {});
            setPlanner(scheduled);
        } catch (err: any) {
            alert(err.message || 'Failed to auto-schedule planner');
        }
    };

    const openLibrary = (source: 'planner' | 'smart' | 'init') => {
        setImportSource(source);
        setShowRelaxedAlert(false);
        const grade = grades.find(g => g.id.toString() === selectedGradeId);
        const subject = subjects.find(s => s.id.toString() === selectedSubjectId);
        
        const standardGrade = grade ? getStandardGradeName(grade.name) : '';
        const standardSubject = subject ? getStandardSubjectName(subject.name) : '';

        setLibraryFilters({
            board: '',
            grade: standardGrade,
            subject: standardSubject,
            search: '',
            page: 1,
            limit: 6
        });
        setViewMode('import-syllabus');
    };

    const openPreview = async (templateId: number) => {
        setSelectedPreviewTemplateId(templateId);
        setLoadingPreview(true);
        try {
            const data = await get<any>(`/school/planners/smart/templates/${templateId}`);
            setPreviewData(data);
        } catch (err) {
            console.error('Failed to load template details', err);
            alert('Failed to load template details');
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleImportTemplate = async (templateId: number) => {
        if (importSource === 'smart' && !selectedClassroomId) {
            alert('Please select a Classroom/Section first.');
            return;
        }
        
        setIsGeneratingSmart(true);
        try {
            if (importSource === 'smart') {
                const payload = {
                    academic_year_id: parseInt(selectedYearId),
                    school_subject_id: parseInt(selectedSubjectId),
                    classroom_id: parseInt(selectedClassroomId),
                    teacher_id: selectedTeacherId ? parseInt(selectedTeacherId) : null,
                    global_syllabus_id: templateId
                };
                const res = await post<any>('/school/planners/smart/subscribe', payload);
                setSmartPlan(res);
                setViewMode('planner');
            } else {
                let currentPlannerId = planner?.id;

                if (!currentPlannerId) {
                    const currentYearObj = academicYears.find(y => y.id.toString() === selectedYearId);
                    const payload = {
                        academic_year_id: parseInt(selectedYearId),
                        staff_id: parseInt(selectedTeacherId),
                        subject_id: parseInt(selectedSubjectId),
                        grade_id: parseInt(selectedGradeId),
                        start_date: currentYearObj?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
                        end_date: currentYearObj?.end_date?.split('T')[0] || new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
                    };
                    const created = await post<any>('/school/planners', payload);
                    currentPlannerId = created.id;
                }
                
                const planDetails = await post<any>(`/school/planners/${currentPlannerId}/import-global-syllabus`, {
                    global_syllabus_id: templateId
                });
                setPlanner(planDetails);
                setViewMode('planner');
            }
            alert('Syllabus imported and synchronized successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to process subscription');
        } finally {
            setIsGeneratingSmart(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'import-syllabus') {
            loadLibraryTemplates();
        }
    }, [libraryFilters, viewMode]);

    const loadLibraryTemplates = async () => {
        setLibraryLoading(true);
        try {
            const offset = (libraryFilters.page - 1) * libraryFilters.limit;
            const queryParams = new URLSearchParams({
                limit: libraryFilters.limit.toString(),
                offset: offset.toString()
            });
            if (libraryFilters.board) queryParams.append('board_name', libraryFilters.board);
            if (libraryFilters.grade) queryParams.append('grade_name', libraryFilters.grade);
            if (libraryFilters.subject) queryParams.append('subject_name', libraryFilters.subject);
            if (libraryFilters.search) queryParams.append('search', libraryFilters.search);

            const res = await get<any>(`/school/planners/smart/templates?${queryParams.toString()}`);
            if (res) {
                if ((res.total === 0 || !res.items || res.items.length === 0) && (libraryFilters.grade || libraryFilters.subject)) {
                    setShowRelaxedAlert(true);
                    setLibraryFilters(prev => ({
                        ...prev,
                        grade: '',
                        subject: '',
                        page: 1
                    }));
                    return;
                }
                setLibraryTemplates(res.items || []);
                setLibraryTotal(res.total || 0);
            }
        } catch (err) {
            console.error('Failed to load library templates', err);
            setLibraryTemplates([]);
            setLibraryTotal(0);
        } finally {
            setLibraryLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setShowRelaxedAlert(false);
        setLibraryFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setLibraryFilters(prev => ({ ...prev, page: newPage }));
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'in_progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getProbabilityBadge = (prob: string) => {
        if (prob.includes('High')) {
            return (
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Check className="w-3.5 h-3.5" /> {prob}
                </div>
            );
        } else if (prob.includes('Medium')) {
            return (
                <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5" /> {prob}
                </div>
            );
        } else {
            return (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> {prob}
                </div>
            );
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {viewMode === 'import-syllabus' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setViewMode('planner')}
                                className="w-12 h-12 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all hover:scale-105 active:scale-95"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    Global Syllabus Library
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
                                        v2.0
                                    </span>
                                </h1>
                                <p className="text-slate-500 text-xs font-semibold mt-1">Browse, filter, and subscribe to official board-aligned master blueprints.</p>
                            </div>
                        </div>

                        {importSource === 'smart' && (
                            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Classroom:</span>
                                <select 
                                    value={selectedClassroomId}
                                    onChange={e => setSelectedClassroomId(e.target.value)}
                                    className="bg-slate-50 border-none rounded-xl text-xs font-black px-4 py-2 focus:ring-2 focus:ring-primary/10 outline-none"
                                >
                                    <option value="">-- Select Classroom --</option>
                                    {classrooms.filter(c => !selectedGradeId || c.grade_id?.toString() === selectedGradeId.toString()).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Filter & Search Dashboard */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Education Board</label>
                            <select 
                                value={libraryFilters.board}
                                onChange={e => handleFilterChange('board', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            >
                                <option value="">All Boards</option>
                                {boards.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grade Level</label>
                            <select 
                                value={libraryFilters.grade}
                                onChange={e => handleFilterChange('grade', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            >
                                <option value="">All Grades</option>
                                {gradesList.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject Area</label>
                            <select 
                                value={libraryFilters.subject}
                                onChange={e => handleFilterChange('subject', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            >
                                <option value="">All Subjects</option>
                                {subjectsList.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Keywords</label>
                            <div className="relative flex items-center">
                                <input 
                                    type="text"
                                    placeholder="Search by syllabus name..."
                                    value={libraryFilters.search}
                                    onChange={e => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                />
                                <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Template Grid */}
                    {showRelaxedAlert && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl p-5 text-xs font-semibold flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 duration-300">
                            <span className="text-base">💡</span>
                            <div>
                                <p className="font-bold text-amber-950">No exact blueprints match your school's custom Grade or Subject names.</p>
                                <p className="mt-0.5 text-amber-800/80">We've automatically cleared the strict filters so you can browse all templates. Please choose the closest matching syllabus blueprint for your course.</p>
                            </div>
                        </div>
                    )}

                    {libraryLoading ? (
                        <div className="flex items-center justify-center p-24">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : libraryTemplates.length === 0 ? (
                        <div className="bg-slate-50 rounded-[3rem] p-16 text-center border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto shadow-sm mb-6">
                                <BookOpen size={30} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">No Templates Found</h2>
                            <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto italic">
                                We couldn't find any master templates matching your selected filter taxonomy. Try clearing some filters.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {libraryTemplates.map(t => (
                                    <div 
                                        key={t.id} 
                                        className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm flex items-center gap-1">
                                                    <Globe size={9} /> {t.board_name}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                                    v{t.academic_year || '1.0'}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-primary transition-colors">{t.board_name} {t.grade_name} {t.subject_name}</h3>
                                            <p className="text-slate-400 text-xs mt-2 line-clamp-2">{t.description || 'Official Board Standard Structured Master Syllabus.'}</p>
                                            
                                            {/* Metrics */}
                                            <div className="grid grid-cols-3 gap-2 mt-5 py-4 border-y border-slate-50">
                                                <div className="text-center">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Chapters</span>
                                                    <p className="text-xs font-black text-slate-800 mt-0.5">{t.chapter_count || 0}</p>
                                                </div>
                                                <div className="text-center border-l border-slate-100">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Topics</span>
                                                    <p className="text-xs font-black text-slate-800 mt-0.5">{t.topic_count || 0}</p>
                                                </div>
                                                <div className="text-center border-l border-slate-100">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Periods</span>
                                                    <p className="text-xs font-black text-slate-800 mt-0.5">{t.total_recommended_hours || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-2 grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => openPreview(t.id)}
                                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all border border-slate-100 flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                                            >
                                                <BookOpen size={13} /> Details
                                            </button>
                                            <button 
                                                onClick={() => handleImportTemplate(t.id)}
                                                disabled={isGeneratingSmart}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-100"
                                            >
                                                {isGeneratingSmart ? (
                                                    <Loader2 size={13} className="animate-spin" />
                                                ) : (
                                                    <Plus size={13} />
                                                )}
                                                {importSource === 'smart' ? 'Auto-Plan' : 'Import'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {libraryTotal > libraryFilters.limit && (
                                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Showing {Math.min(libraryTotal, (libraryFilters.page - 1) * libraryFilters.limit + 1)} - {Math.min(libraryTotal, libraryFilters.page * libraryFilters.limit)} of {libraryTotal} Blueprints
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            disabled={libraryFilters.page === 1}
                                            onClick={() => handlePageChange(libraryFilters.page - 1)}
                                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                        >
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <button 
                                            disabled={libraryFilters.page * libraryFilters.limit >= libraryTotal}
                                            onClick={() => handlePageChange(libraryFilters.page + 1)}
                                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                        >
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Planner</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Smart Syllabus Engine & Target Tracker</p>
                        </div>
                    </header>

                    {/* Filter Hub */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Year</label>
                            <select 
                                value={selectedYearId}
                                onChange={e => setSelectedYearId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            >
                                <option value="">Select Academic Year</option>
                                {academicYears.map(year => (
                                    <option key={year.id} value={year.id}>{year.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Class / Grade</label>
                            <select 
                                value={selectedGradeId}
                                onChange={e => setSelectedGradeId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            >
                                <option value="">Select Grade</option>
                                {grades.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject</label>
                            <select 
                                value={selectedSubjectId}
                                onChange={e => setSelectedSubjectId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Assigned Teacher</label>
                            <select 
                                value={selectedTeacherId}
                                disabled={isTeacher}
                                onChange={e => setSelectedTeacherId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all disabled:opacity-75"
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name || ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Classroom / Section</label>
                            <select 
                                value={selectedClassroomId}
                                onChange={e => setSelectedClassroomId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            >
                                <option value="">Select Section</option>
                                {classrooms.filter(c => !selectedGradeId || c.grade_id?.toString() === selectedGradeId.toString()).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : !selectedYearId || !selectedGradeId || !selectedSubjectId || !selectedTeacherId || !selectedClassroomId ? (
                        <div className="bg-slate-50 rounded-[3rem] p-16 text-center border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto shadow-sm mb-6">
                                <BookOpen size={30} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Select Classroom, Subject & Grade</h2>
                            <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto italic">
                                "Give me six hours to chop down a tree and I will spend the first four sharpening the axe." — Select parameters to prepare your classroom academic syllabus structure.
                            </p>
                        </div>
                    ) : !planner ? (
                        <div className="max-w-md mx-auto bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                            <header className="text-center mb-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-100 shadow-inner">
                                    <BookOpen size={30} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Initialize Academic Planner</h2>
                                <p className="text-slate-400 text-xs font-semibold mt-1">Set your academic term date range to start planning.</p>
                            </header>
                            <form onSubmit={handleCreatePlanner} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Term Start Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={initData.start_date}
                                        onChange={e => setInitData(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Term End Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={initData.end_date}
                                        onChange={e => setInitData(prev => ({ ...prev, end_date: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                    />
                                </div>
                                <div className="pt-2 space-y-3">
                                    <button type="submit" className="w-full btn-primary py-3.5 font-black uppercase text-xs tracking-wider">
                                        Initialize Manual Plan
                                    </button>
                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-slate-100"></div>
                                        <span className="flex-shrink mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Or</span>
                                        <div className="flex-grow border-t border-slate-100"></div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => openLibrary('init')}
                                        disabled={isGeneratingSmart}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] py-3.5 font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                                    >
                                        {isGeneratingSmart ? (
                                            <Loader2 size={16} className="animate-spin text-white" />
                                        ) : (
                                            <Sparkles size={16} className="text-white animate-pulse" />
                                        )}
                                        Import Global Syllabus
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Metrics Panel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between shadow-xl relative overflow-hidden group">
                            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/5 rounded-full group-hover:scale-110 transition-transform" />
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Completion</span>
                                <TrendingUp className="text-emerald-400 w-5 h-5" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-4xl font-black tracking-tight">{planner.metrics?.progressPercentage}%</h3>
                                <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${planner.metrics?.progressPercentage}%` }} />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">
                                    {planner.metrics?.completedChapters} of {planner.metrics?.totalChapters} Chapters Finished
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Lesson Hours</span>
                                <Clock className="text-sky-500 w-5 h-5" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{planner.metrics?.completedLessons} / {planner.metrics?.totalLessons}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">
                                    Class hours / lesson periods covered
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Term Days</span>
                                <CalendarRange className="text-amber-500 w-5 h-5" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{planner.metrics?.remainingDays} Days</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">
                                    Ends on {new Date(planner.end_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Completion Forecast</span>
                                <Target className="text-indigo-500 w-5 h-5" />
                            </div>
                            <div className="mt-6 space-y-2">
                                {getProbabilityBadge(planner.metrics?.probability || 'On Track')}
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Based on pace rate vs remaining dates
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <header className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                                <button 
                                    onClick={() => setActiveTab('chapters')}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'chapters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Syllabus & Progress
                                </button>
                                <button 
                                    onClick={() => setActiveTab('milestones')}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'milestones' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Term Milestones
                                </button>
                                <button 
                                    onClick={() => setActiveTab('smart')}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'smart' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Smart Timetable Plan
                                </button>
                                <button 
                                    onClick={() => setActiveTab('manual-schedule')}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'manual-schedule' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Manual Period Planner
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTab === 'chapters' && (
                                    <>
                                        <button 
                                            onClick={() => openLibrary('planner')}
                                            disabled={isGeneratingSmart}
                                            className="px-5 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-indigo-100 disabled:opacity-50"
                                            title="Replace manual planner with Global Syllabus"
                                        >
                                            {isGeneratingSmart ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            {isGeneratingSmart ? 'Generating...' : 'Import Global Syllabus'}
                                        </button>
                                        <button 
                                            onClick={handleAutoSchedule}
                                            className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                                        >
                                            <Sparkles size={14} className="text-amber-400" /> Auto-Schedule Dates
                                        </button>
                                        <button 
                                            onClick={() => setShowChapterModal(true)}
                                            className="btn-primary inline-flex items-center gap-1.5"
                                        >
                                            <Plus size={14} /> Add Chapter
                                        </button>
                                    </>
                                )}
                                {activeTab === 'milestones' && (
                                    <button 
                                        onClick={() => setShowMilestoneModal(true)}
                                        className="btn-primary inline-flex items-center gap-1.5"
                                    >
                                        <Plus size={14} /> Add Milestone
                                    </button>
                                )}
                                {activeTab === 'smart' && smartPlan && (
                                    <button 
                                        onClick={() => openLibrary('smart')}
                                        disabled={isGeneratingSmart}
                                        className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                                    >
                                        {isGeneratingSmart ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-400" />}
                                        Re-Sync Timetable
                                    </button>
                                )}
                            </div>
                        </header>

                        <div className="p-8">
                            {activeTab === 'chapters' ? (
                                !planner.chapters || planner.chapters.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <h3 className="text-base font-black text-slate-950">No Chapters Loaded</h3>
                                        <p className="text-slate-400 text-xs italic mt-1">"A journey of a thousand miles begins with a single step."</p>
                                        <button 
                                            onClick={() => setShowChapterModal(true)}
                                            className="btn-primary mt-6 inline-flex items-center gap-1.5"
                                        >
                                            <Plus size={14} /> Add Chapter
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {planner.chapters?.map((ch: any, idx: number) => (
                                            <div 
                                                key={ch.id} 
                                                className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col gap-5 bg-white shadow-sm"
                                            >
                                                {/* Chapter Header Row */}
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="flex items-start gap-4">
                                                        <button 
                                                            onClick={() => handleUpdateChapterStatus(ch.id, ch.status)}
                                                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                                                                ch.status === 'completed' 
                                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                                : ch.status === 'in_progress'
                                                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                                                : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300'
                                                            }`}
                                                            title="Toggle status: Pending ➡️ In Progress ➡️ Completed"
                                                        >
                                                            {ch.status === 'completed' ? <Check size={16} /> : ch.status === 'in_progress' ? <Play size={14} /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
                                                        </button>

                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase text-slate-400">Chapter {idx + 1}</span>
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusStyle(ch.status)}`}>
                                                                    {ch.status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-base font-black text-slate-900 mt-1">{ch.name}</h4>
                                                            <p className="text-slate-400 text-xs mt-0.5">{ch.description || 'No description provided'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 self-end md:self-center flex-wrap md:flex-nowrap">
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Weight / Periods</span>
                                                            <p className="text-xs font-black text-slate-900">{ch.estimated_lessons} lessons</p>
                                                        </div>

                                                        <div className="text-right border-l border-slate-100 pl-6">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Term Dates</span>
                                                            <p className="text-xs font-black text-slate-900">
                                                                {ch.start_date && ch.end_date 
                                                                    ? `${new Date(ch.start_date).toLocaleDateString()} - ${new Date(ch.end_date).toLocaleDateString()}`
                                                                    : 'Not Scheduled'
                                                                }
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-1 border-l border-slate-100 pl-6">
                                                            <button 
                                                                disabled={idx === 0}
                                                                onClick={() => handleMoveChapter(ch.id, 'up')}
                                                                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center text-slate-400 disabled:opacity-30 transition-all border border-slate-100"
                                                                title="Move Chapter Up"
                                                            >
                                                                <ArrowUp size={14} />
                                                            </button>
                                                            <button 
                                                                disabled={idx === (planner.chapters?.length || 0) - 1}
                                                                onClick={() => handleMoveChapter(ch.id, 'down')}
                                                                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center text-slate-400 disabled:opacity-30 transition-all border border-slate-100"
                                                                title="Move Chapter Down"
                                                            >
                                                                <ArrowDown size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => openEditChapterModal(ch)}
                                                                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center text-slate-400 transition-all border border-slate-100"
                                                                title="Edit Chapter"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteChapter(ch.id)}
                                                                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition-all border border-slate-100"
                                                                title="Delete Chapter"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Topics Section */}
                                                <div className="pt-4 border-t border-slate-100 space-y-3">
                                                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lessons & Topics</h5>
                                                    
                                                    {ch.topics && ch.topics.length > 0 ? (
                                                        <div className="space-y-2 pl-2">
                                                            {ch.topics.map((topic: any, tIdx: number) => (
                                                                <div 
                                                                    key={topic.id} 
                                                                    className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/30 border border-slate-100 hover:border-indigo-100/50 transition-all"
                                                                >
                                                                    {editingTopicId === topic.id ? (
                                                                        <div className="flex items-center gap-2 flex-grow">
                                                                            <input 
                                                                                type="text" 
                                                                                value={editTopicTitle}
                                                                                onChange={(e) => setEditTopicTitle(e.target.value)}
                                                                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-grow"
                                                                                autoFocus
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') handleUpdateTopic(topic.id);
                                                                                    if (e.key === 'Escape') setEditingTopicId(null);
                                                                                }}
                                                                            />
                                                                            <button 
                                                                                onClick={() => handleUpdateTopic(topic.id)}
                                                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                                                                            >
                                                                                Save
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => setEditingTopicId(null)}
                                                                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-bold transition-all"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex items-center gap-2.5">
                                                                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                                                                                    {tIdx + 1}
                                                                                </span>
                                                                                <span className="text-xs font-semibold text-slate-700">{topic.title}</span>
                                                                            </div>
                                                                            
                                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button 
                                                                                    disabled={tIdx === 0}
                                                                                    onClick={() => handleMoveTopic(topic.id, 'up')}
                                                                                    className="w-7 h-7 rounded-lg hover:bg-white hover:text-indigo-600 flex items-center justify-center text-slate-400 disabled:opacity-30 transition-all"
                                                                                    title="Move Topic Up"
                                                                                >
                                                                                    <ArrowUp size={12} />
                                                                                </button>
                                                                                <button 
                                                                                    disabled={tIdx === ch.topics.length - 1}
                                                                                    onClick={() => handleMoveTopic(topic.id, 'down')}
                                                                                    className="w-7 h-7 rounded-lg hover:bg-white hover:text-indigo-600 flex items-center justify-center text-slate-400 disabled:opacity-30 transition-all"
                                                                                    title="Move Topic Down"
                                                                                >
                                                                                    <ArrowDown size={12} />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        setEditingTopicId(topic.id);
                                                                                        setEditTopicTitle(topic.title);
                                                                                    }}
                                                                                    className="w-7 h-7 rounded-lg hover:bg-white hover:text-amber-600 flex items-center justify-center text-slate-400 transition-all"
                                                                                    title="Edit Topic"
                                                                                >
                                                                                    <Edit size={12} />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleDeleteTopic(topic.id)}
                                                                                    className="w-7 h-7 rounded-lg hover:bg-white hover:text-rose-600 flex items-center justify-center text-slate-400 transition-all"
                                                                                    title="Delete Topic"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-slate-400 italic pl-2">No topics added yet. Add lessons or topics to structure this chapter.</p>
                                                    )}

                                                    {/* Quick Add Form */}
                                                    <form 
                                                        onSubmit={(e) => handleAddTopic(ch.id, e)}
                                                        className="flex items-center gap-2 pl-2 mt-2"
                                                    >
                                                        <input 
                                                            type="text" 
                                                            placeholder="Add new lesson/topic..."
                                                            value={newTopicTitles[ch.id] || ''}
                                                            onChange={(e) => setNewTopicTitles(prev => ({ ...prev, [ch.id]: e.target.value }))}
                                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-350 focus:ring-1 focus:ring-slate-350 transition-all flex-grow max-w-md"
                                                        />
                                                        <button 
                                                            type="submit"
                                                            disabled={!(newTopicTitles[ch.id] || '').trim()}
                                                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200/50 hover:border-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 disabled:hover:border-slate-200/50"
                                                        >
                                                            <Plus size={12} /> Add
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : activeTab === 'milestones' ? (
                                !planner.milestones || planner.milestones.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <h3 className="text-base font-black text-slate-950">No Milestones Tagged</h3>
                                        <p className="text-slate-400 text-xs italic mt-1">Register examinations, milestones, or tests along the timeline.</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l border-slate-200 ml-4 space-y-8 py-4">
                                        {planner.milestones?.map((mil: any) => (
                                            <div key={mil.id} className="relative pl-8">
                                                <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center" />
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-slate-400">
                                                        {new Date(mil.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <h4 className="text-base font-black text-slate-900 mt-1">{mil.name}</h4>
                                                    <p className="text-slate-400 text-xs mt-0.5">{mil.description || 'No description provided'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : activeTab === 'smart' ? (
                                !selectedClassroomId ? (
                                    <div className="py-16 text-center">
                                        <h3 className="text-base font-black text-slate-900">Select Section / Classroom</h3>
                                        <p className="text-slate-400 text-xs italic mt-1">Please select a section to view its day-by-day smart schedule.</p>
                                    </div>
                                ) : loadingSmartPlan ? (
                                    <div className="flex items-center justify-center p-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                    </div>
                                ) : !smartPlan ? (
                                    <div className="py-16 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner border border-slate-100 mb-4">
                                            <BookOpen size={24} />
                                        </div>
                                        <h3 className="text-base font-black text-slate-900">No Smart Plan Found</h3>
                                        <p className="text-slate-400 text-xs italic mt-1 max-w-sm">
                                            Subscribe this section/subject to a Global Syllabus blueprint to auto-plan the whole academic term.
                                        </p>
                                        <button 
                                            onClick={() => openLibrary('smart')}
                                            className="btn-primary mt-6 inline-flex items-center gap-1.5"
                                        >
                                            <Sparkles size={14} /> Subscribe & Auto-Plan
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        {/* Metrics Dashboard */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {[
                                                { label: 'Total Chapters', value: smartPlan.metrics?.totalChapters, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                                { label: 'Topics Covered', value: `${smartPlan.metrics?.completedTopics}/${smartPlan.metrics?.totalTopics}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                                { label: 'Remaining Days', value: smartPlan.metrics?.remainingDays, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                                                { label: 'Syllabus Progress', value: `${smartPlan.metrics?.progress}%`, icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' }
                                            ].map((stat, i) => {
                                                const Icon = stat.icon;
                                                return (
                                                    <div key={i} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 group hover:bg-white transition-all flex flex-col justify-between">
                                                        <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="text-2xl font-black text-slate-800 mb-1">{stat.value}</div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Timeline */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Scheduled Timetable Sessions</h3>
                                            {!smartPlan.plannedSessions || smartPlan.plannedSessions.length === 0 ? (
                                                <p className="text-slate-400 text-xs italic">No upcoming sessions found. Generate a plan first.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {smartPlan.plannedSessions?.map((session: any) => (
                                                        <div key={session.id} className="group bg-slate-50/30 rounded-[2rem] border border-slate-100 p-5 flex flex-col md:flex-row md:items-center gap-5 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all">
                                                            {/* Date Block */}
                                                            <div className="w-full md:w-40 flex-shrink-0 bg-slate-100/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-200/50">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Scheduled</span>
                                                                <span className="text-xs font-black text-slate-800 text-center">{session.date}</span>
                                                            </div>

                                                            {/* Info Block */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100/30">
                                                                        {session.type}
                                                                    </span>
                                                                    <span className="text-xs font-bold text-slate-400 truncate max-w-[200px]" title={session.chapter}>{session.chapter}</span>
                                                                </div>
                                                                <h4 className="text-base font-black text-slate-800 leading-snug">{session.topic}</h4>
                                                            </div>

                                                            {/* Status Actions */}
                                                            <div className="flex items-center gap-3">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                                    session.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                    session.status === 'DELAYED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                    'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                                }`}>
                                                                    {session.status}
                                                                </span>
                                                                <button 
                                                                    onClick={() => openEditSessionModal(session)}
                                                                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center text-slate-400 transition-all border border-slate-100"
                                                                    title="Edit Session Details"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            ) : (
                                // Manual Period Planner view
                                !selectedClassroomId ? (
                                    <div className="py-16 text-center">
                                        <h3 className="text-base font-black text-slate-900">Select Classroom / Section</h3>
                                        <p className="text-slate-400 text-xs italic mt-1">Please select a section to configure manual periods.</p>
                                    </div>
                                ) : loadingManualPlanner ? (
                                    <div className="flex items-center justify-center p-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                    </div>
                                ) : timetableEntries.length === 0 ? (
                                    <div className="py-16 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-rose-400 shadow-inner border border-slate-100 mb-4">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <h3 className="text-base font-black text-slate-900">No Timetable Mapped</h3>
                                        <p className="text-slate-400 text-xs italic mt-1 max-w-sm">
                                            There are no scheduled timetable slots for this subject in the selected classroom. Please configure the timetable structure first.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                                        
                                        {/* Backlog / Syllabus Items (Left Column) */}
                                        <div className="lg:col-span-5 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col h-[75vh]">
                                            <header className="mb-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Syllabus Backlog</h3>
                                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                                        {(() => {
                                                            const total = planner?.chapters?.reduce((acc: number, ch: any) => acc + (ch.topics?.length || 0), 0) || 0;
                                                            const scheduledCount = planner?.chapters?.reduce((acc: number, ch: any) => {
                                                                const count = ch.topics?.filter((t: any) => 
                                                                    lessonPlansList.some((lp: any) => lp.planner_topic_id === t.id && lp.planner_topic_id !== null)
                                                                ).length || 0;
                                                                return acc + count;
                                                            }, 0) || 0;
                                                            return `${total - scheduledCount} / ${total} Remaining`;
                                                        })()}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Drag unscheduled topics onto upcoming empty slots</p>
                                            </header>

                                            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                                                {planner?.chapters?.map((ch: any) => {
                                                    // Filter for unscheduled topics in this chapter
                                                    const unscheduledTopics = ch.topics?.filter((t: any) => 
                                                        !lessonPlansList.some((lp: any) => lp.planner_topic_id === t.id && lp.planner_topic_id !== null)
                                                    ) || [];

                                                    if (unscheduledTopics.length === 0) return null;

                                                    return (
                                                        <div key={ch.id} className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-xs font-black text-slate-800 line-clamp-1 max-w-[200px]" title={ch.name}>
                                                                    {ch.name}
                                                                </h4>
                                                                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                                                                    {unscheduledTopics.length} left
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                                                {unscheduledTopics.map((top: any) => (
                                                                    <div 
                                                                        key={top.id}
                                                                        draggable
                                                                        onDragStart={(e) => {
                                                                            e.dataTransfer.setData("text/plain", JSON.stringify({ topicId: top.id, chapterId: ch.id, title: top.title }));
                                                                        }}
                                                                        className="p-2.5 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 border border-slate-100 rounded-xl cursor-move transition-all active:scale-95 flex items-center gap-2 group/backlog"
                                                                        title="Drag and drop this topic to a slot"
                                                                    >
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/backlog:bg-indigo-500 transition-colors" />
                                                                        <span className="text-[11px] font-semibold text-slate-700 line-clamp-1 flex-1">
                                                                            {top.title}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {planner?.chapters?.every((ch: any) => 
                                                    ch.topics?.every((t: any) => 
                                                        lessonPlansList.some((lp: any) => lp.planner_topic_id === t.id && lp.planner_topic_id !== null)
                                                    )
                                                ) && (
                                                    <div className="py-12 text-center text-slate-400 text-xs italic">
                                                        🎉 All syllabus topics have been scheduled successfully!
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timeline of upcoming slots (Right Column) */}
                                        <div className="lg:col-span-7 bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col h-[75vh]">
                                            <header className="mb-4">
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Available Periods Timeline</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Calendar slots generated from weekly timetable</p>
                                            </header>

                                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                                {getUpcomingPeriods(timetableEntries, holidaysList).map((slot) => {
                                                    // Find if there is an existing lesson plan for this date and time
                                                    const assignedLesson = lessonPlansList.find((lp: any) => 
                                                        lp.scheduled_date.split('T')[0] === slot.date && 
                                                        lp.period_start_time.startsWith(slot.time) && 
                                                        lp.planner_topic_id !== null
                                                    );

                                                    const isDragOver = dragOverSlotId === slot.slotId;

                                                    return (
                                                        <div 
                                                            key={slot.slotId}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                if (!assignedLesson) setDragOverSlotId(slot.slotId);
                                                            }}
                                                            onDragLeave={() => setDragOverSlotId(null)}
                                                            onDrop={async (e) => {
                                                                e.preventDefault();
                                                                setDragOverSlotId(null);
                                                                if (assignedLesson) return;
                                                                try {
                                                                    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                                                                    await handleAssignTopicToSlot(data, slot.date, slot.start_time);
                                                                } catch (err) {
                                                                    console.error(err);
                                                                }
                                                            }}
                                                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center gap-4 ${
                                                                assignedLesson 
                                                                    ? 'bg-indigo-50/20 border-indigo-100 hover:bg-indigo-50/40' 
                                                                    : isDragOver
                                                                        ? 'bg-indigo-50 border-indigo-300 border-dashed scale-[1.01] shadow-md shadow-indigo-100/50'
                                                                        : 'bg-slate-50/30 border-dashed border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50'
                                                            }`}
                                                        >
                                                            {/* Date Badge */}
                                                            <div className="flex items-center gap-2.5 sm:w-36 flex-shrink-0">
                                                                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/50 flex flex-col items-center justify-center flex-shrink-0 text-slate-500">
                                                                    <span className="text-[8px] font-black uppercase leading-none">{slot.dayName}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-black text-slate-800 leading-tight">{slot.formattedDate}</span>
                                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-0.5">
                                                                        <Clock size={10} />
                                                                        <span>{slot.time}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Assignment Details */}
                                                            <div className="flex-grow flex items-center justify-between gap-4">
                                                                {assignedLesson ? (
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-wider">
                                                                                Planned
                                                                            </span>
                                                                            <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]" title={assignedLesson.chapter_name}>
                                                                                {assignedLesson.chapter_name}
                                                                            </span>
                                                                        </div>
                                                                        <h5 className="text-xs font-black text-slate-800 mt-1 truncate" title={assignedLesson.topic_title}>
                                                                            {assignedLesson.topic_title}
                                                                        </h5>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex-1 flex items-center justify-between text-slate-400 py-1">
                                                                        <span className="text-[11px] font-semibold italic">
                                                                            {isDragOver ? 'Drop here to assign!' : 'Unplanned slot (periods available)'}
                                                                        </span>
                                                                        
                                                                        {/* Inline Selection Dropdown for accessibility and convenience */}
                                                                        <select
                                                                            onChange={async (e) => {
                                                                                const val = e.target.value;
                                                                                if (!val) return;
                                                                                const data = JSON.parse(val);
                                                                                await handleAssignTopicToSlot(data, slot.date, slot.start_time);
                                                                            }}
                                                                            defaultValue=""
                                                                            className="text-[10px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 outline-none max-w-[140px]"
                                                                        >
                                                                            <option value="" disabled>Quick Assign</option>
                                                                            {planner?.chapters?.map((ch: any) => {
                                                                                const unscheduled = ch.topics?.filter((t: any) => 
                                                                                    !lessonPlansList.some((lp: any) => lp.planner_topic_id === t.id && lp.planner_topic_id !== null)
                                                                                ) || [];
                                                                                if (unscheduled.length === 0) return null;
                                                                                return (
                                                                                    <optgroup key={ch.id} label={ch.name}>
                                                                                        {unscheduled.map((t: any) => (
                                                                                            <option key={t.id} value={JSON.stringify({ topicId: t.id, chapterId: ch.id, title: t.title })}>
                                                                                                {t.title}
                                                                                            </option>
                                                                                        ))}
                                                                                    </optgroup>
                                                                                );
                                                                            })}
                                                                        </select>
                                                                    </div>
                                                                )}

                                                                {assignedLesson && (
                                                                    <button 
                                                                        onClick={() => handleUnassignSlot(assignedLesson)}
                                                                        className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all flex-shrink-0"
                                                                        title="Unschedule lesson"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )}

            {/* Add Chapter Modal */}
            {showChapterModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-950">Add Chapter / Syllabus Item</h3>
                            <button onClick={() => setShowChapterModal(false)} className="text-slate-400 hover:text-slate-950">Cancel</button>
                        </header>
                        <form onSubmit={handleAddChapter} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Chapter Title</label>
                                <input 
                                    type="text"
                                    required
                                    value={chapterData.name}
                                    onChange={e => setChapterData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Introduction to Organic Chemistry"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Estimated Lessons / Class Hours</label>
                                <input 
                                    type="number"
                                    required
                                    min={1}
                                    value={chapterData.estimated_lessons}
                                    onChange={e => setChapterData(prev => ({ ...prev, estimated_lessons: parseInt(e.target.value) || 1 }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                                <textarea 
                                    value={chapterData.description}
                                    onChange={e => setChapterData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Key learning concepts to be taught..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary py-3.5 mt-2 font-black uppercase text-xs tracking-wider">
                                Add Chapter
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Milestone Modal */}
            {showMilestoneModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-950">Add Term Milestone</h3>
                            <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-950">Cancel</button>
                        </header>
                        <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Milestone Title</label>
                                <input 
                                    type="text"
                                    required
                                    value={milestoneData.name}
                                    onChange={e => setMilestoneData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Midterm Examination Period"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Target Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={milestoneData.target_date}
                                    onChange={e => setMilestoneData(prev => ({ ...prev, target_date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                                <textarea 
                                    value={milestoneData.description}
                                    onChange={e => setMilestoneData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Key milestones or evaluation targets..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary py-3.5 mt-2 font-black uppercase text-xs tracking-wider">
                                Add Milestone
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Syllabus Preview Drawer */}
            {selectedPreviewTemplateId && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                        onClick={() => { setSelectedPreviewTemplateId(null); setPreviewData(null); }}
                    />
                    
                    {/* Slide-over panel */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md md:max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                            {/* Header */}
                            <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Syllabus Blueprint Details</h3>
                                    {previewData && (
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            {previewData.board_name} • {previewData.grade_name} • {previewData.subject_name}
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => { setSelectedPreviewTemplateId(null); setPreviewData(null); }}
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-105"
                                >
                                    ✕
                                </button>
                            </header>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {loadingPreview ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading blueprint details...</p>
                                    </div>
                                ) : !previewData ? (
                                    <p className="text-slate-400 text-xs italic text-center">Failed to load blueprint details.</p>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* Intro info */}
                                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm flex items-center gap-1">
                                                    <Globe size={9} /> {previewData.board_name}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                                    v{previewData.academic_year || '1.0'}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 leading-snug">{previewData.board_name} {previewData.grade_name} {previewData.subject_name}</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">{previewData.description || 'Official Board Standard Structured Master Syllabus Blueprint.'}</p>
                                            
                                            {/* Overall Stats */}
                                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 text-center">
                                                <div>
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Chapters</span>
                                                    <p className="text-sm font-black text-slate-800 mt-0.5">{previewData.chapters?.length || 0}</p>
                                                </div>
                                                <div className="border-l border-slate-200/60">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Total Topics</span>
                                                    <p className="text-sm font-black text-slate-800 mt-0.5">
                                                        {previewData.chapters?.reduce((sum: number, c: any) => sum + (c.topics?.length || 0), 0)}
                                                    </p>
                                                </div>
                                                <div className="border-l border-slate-200/60">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Rec. Periods</span>
                                                    <p className="text-sm font-black text-slate-800 mt-0.5">{previewData.total_recommended_hours || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chapters & Topics List */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Syllabus Outline</h4>
                                            
                                            {previewData.chapters?.length === 0 ? (
                                                <p className="text-slate-400 text-xs italic">No chapters defined in this template.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {previewData.chapters?.map((chap: any, idx: number) => (
                                                        <div key={chap.id} className="p-5 rounded-2xl border border-slate-100 space-y-3 bg-white hover:border-slate-200 transition-all shadow-sm animate-in fade-in duration-200">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div>
                                                                    <span className="text-[9px] font-black uppercase text-slate-400">Chapter {idx + 1}</span>
                                                                    <h5 className="text-sm font-black text-slate-800 mt-0.5 leading-snug">{chap.title}</h5>
                                                                </div>
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100/50 flex-shrink-0 font-bold">
                                                                    {chap.recommended_periods || 5} Periods
                                                                </span>
                                                            </div>
                                                            {chap.description && (
                                                                <p className="text-slate-400 text-[11px] leading-relaxed italic">{chap.description}</p>
                                                            )}
                                                            
                                                            {/* Topics nested */}
                                                            {chap.topics && chap.topics.length > 0 && (
                                                                <div className="pt-2 border-t border-slate-50 space-y-1.5">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Included Topics:</span>
                                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-2">
                                                                        {chap.topics.map((top: any) => (
                                                                            <li key={top.id} className="text-slate-600 text-[11px] font-semibold flex items-start gap-1.5 leading-normal">
                                                                                <span className="text-indigo-400 font-black mt-0.5">•</span>
                                                                                <span className="line-clamp-2">{top.title}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {previewData && (
                                <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
                                    <button 
                                        onClick={() => { setSelectedPreviewTemplateId(null); setPreviewData(null); }}
                                        className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors"
                                    >
                                        Close Preview
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const tid = previewData.id;
                                            setSelectedPreviewTemplateId(null);
                                            setPreviewData(null);
                                            handleImportTemplate(tid);
                                        }}
                                        disabled={isGeneratingSmart}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50 hover:scale-[1.02]"
                                    >
                                        {isGeneratingSmart ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                            <Plus size={13} />
                                        )}
                                        {importSource === 'smart' ? 'Subscribe & Auto-Plan' : 'Import Syllabus'}
                                    </button>
                                </footer>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Chapter Modal */}
            {editingChapter && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-950">Edit Chapter Details</h3>
                            <button onClick={() => setEditingChapter(null)} className="text-slate-400 hover:text-slate-950">Cancel</button>
                        </header>
                        <form onSubmit={handleUpdateChapter} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Chapter Title</label>
                                <input 
                                    type="text"
                                    required
                                    value={editChapterForm.name}
                                    onChange={e => setEditChapterForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Estimated Lessons / Class Hours</label>
                                <input 
                                    type="number"
                                    required
                                    min={1}
                                    value={editChapterForm.estimated_lessons}
                                    onChange={e => setEditChapterForm(prev => ({ ...prev, estimated_lessons: parseInt(e.target.value) || 1 }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Start Date</label>
                                <input 
                                    type="date"
                                    value={editChapterForm.start_date}
                                    onChange={e => setEditChapterForm(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">End Date</label>
                                <input 
                                    type="date"
                                    value={editChapterForm.end_date}
                                    onChange={e => setEditChapterForm(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
                                <select 
                                    value={editChapterForm.status}
                                    onChange={e => setEditChapterForm(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                                <textarea 
                                    value={editChapterForm.description}
                                    onChange={e => setEditChapterForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary py-3.5 mt-2 font-black uppercase text-xs tracking-wider">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Session Modal */}
            {editingSession && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <header className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-950">Edit Session Details</h3>
                            <button onClick={() => setEditingSession(null)} className="text-slate-400 hover:text-slate-950">Cancel</button>
                        </header>
                        <form onSubmit={handleUpdateSession} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Topic Title</label>
                                <input 
                                    type="text"
                                    required
                                    value={editSessionForm.topic_title}
                                    onChange={e => setEditSessionForm(prev => ({ ...prev, topic_title: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Scheduled Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={editSessionForm.scheduled_date}
                                    onChange={e => setEditSessionForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
                                <select 
                                    value={editSessionForm.status}
                                    onChange={e => setEditSessionForm(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                >
                                    <option value="PLANNED">Planned</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="DELAYED">Delayed</option>
                                    <option value="SKIPPED">Skipped</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Teacher Notes</label>
                                <textarea 
                                    value={editSessionForm.teacher_notes}
                                    onChange={e => setEditSessionForm(prev => ({ ...prev, teacher_notes: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary py-3.5 mt-2 font-black uppercase text-xs tracking-wider">
                                Save Session Details
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
