import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Cake,
  Clock,
  AlertCircle,
  Filter,
  Search,
  Plus,
  Loader2
} from 'lucide-react';
import { TimetableApi } from '../../api/timetable.api';
import { examApi } from '../../api/exam.api';
import { eventApi, type SchoolEvent } from '../../api/event.api';
import { getStaffList, getMyStaffProfile } from '../../api/staff.api';
import { getMyStudentProfile } from '../../api/student.api';
import { useAuth } from '../../contexts/AuthContext';

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['class', 'exam', 'birthday', 'event']);

  const isAdmin = useMemo(() => user && [1, 2, 3, 4].includes(user.role_id), [user]);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);

      // Load profile for students/teachers to handle filtering
      let userProfile = profile;
      if (!isAdmin && !userProfile) {
        try {
          if (user?.role_id === 14) { // Student
            userProfile = await getMyStudentProfile();
          } else { // Staff/Teacher
            userProfile = await getMyStaffProfile();
          }
          setProfile(userProfile);
        } catch (e) {
          console.error("Failed to load profile", e);
        }
      }

      const [timetable, exams, schoolEvents, staffRes] = await Promise.all([
        TimetableApi.getGlobalSchedule(),
        examApi.getExams(),
        eventApi.getEvents().catch(() => []), // Fallback if not implemented
        getStaffList({ limit: 100 })
      ]);

      const allEvents: any[] = [];

      // 1. Process Timetable (Weekly Repeating)
      timetable.forEach((t: any) => {
        // Filter: Admin/Principal see all
        // Teachers see only their own
        // Students see only their classroom
        if (!isAdmin) {
          const isMyClassAsTeacher = String(t.teacher_user_id) === String(user?.sub);
          const isMyClassAsStudent = userProfile?.classroom_id && t.classroom_id === userProfile.classroom_id;

          if (!isMyClassAsTeacher && !isMyClassAsStudent) return;
        }

        allEvents.push({
          ...t,
          id: `tt-${t.id}`,
          title: t.subject_name,
          subtitle: `${t.classroom_name} • ${t.teacher_name || 'Staff'}`,
          type: 'class',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/10',
          icon: <Clock size={12} />
        });
      });

      // 2. Process Exams
      exams.forEach((e: any) => {
        // Filter exams for students (if possible)
        allEvents.push({
          ...e,
          id: `ex-${e.id}`,
          title: e.name,
          subtitle: 'Examination',
          type: 'exam',
          color: 'bg-purple-50 text-purple-700 border-purple-100 ring-purple-500/10',
          icon: <GraduationCap size={12} />
        });
      });

      // 3. Process General Events
      schoolEvents.forEach((se: SchoolEvent) => {
        allEvents.push({
          ...se,
          id: `se-${se.id}`,
          subtitle: se.description || 'School Event',
          type: 'event',
          color: se.event_type === 'holiday'
            ? 'bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/10'
            : 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10',
          icon: <AlertCircle size={12} />
        });
      });

      // 4. Process Staff Birthdays
      staffRes.data.forEach((staff: any) => {
        if (staff.date_of_birth) {
          allEvents.push({
            id: `bd-${staff.id}`,
            title: `${staff.first_name}'s Birthday`,
            subtitle: staff.designation,
            type: 'birthday',
            date_of_birth: staff.date_of_birth,
            color: 'bg-rose-50 text-rose-700 border-rose-100 ring-rose-500/10',
            icon: <Cake size={12} />
          });
        }
      });

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Padding for previous month
    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = startPadding; i > 0; i--) {
      days.push({ date: new Date(year, month, 1 - i), isPadding: true });
    }

    // Days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isPadding: false });
    }

    // Padding for next month
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), isPadding: true });
    }

    return days;
  }, [currentDate]);

  const getDayEvents = (date: Date) => {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
    const dateString = date.toISOString().split('T')[0];
    const monthDay = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

    return events.filter(e => {
      if (!activeFilters.includes(e.type)) return false;
      if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      if (e.type === 'class') return e.day_of_week === dayOfWeek;

      if (e.type === 'birthday') {
        const staffBD = e.date_of_birth.split('T')[0].substring(5); // MM-DD
        return staffBD === monthDay;
      }

      if (e.type === 'exam' || e.type === 'event') {
        const start = new Date(e.start_date).toISOString().split('T')[0];
        const end = new Date(e.end_date).toISOString().split('T')[0];
        return dateString >= start && dateString <= end;
      }
      return false;
    });
  };

  const toggleFilter = (type: string) => {
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="p-8 space-y-6 min-h-screen bg-slate-50/50">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <CalendarIcon size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Global Academic Calendar</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm font-medium transition-all w-64"
            />
          </div>

          <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-primary transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {isAdmin && (
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
              <Plus size={18} />
              <span>Create</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Calendar Grid */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[130px]">
              {daysInMonth.map((day, i) => {
                const dayEvents = getDayEvents(day.date);
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isSelected = selectedDay?.toDateString() === day.date.toDateString();

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(day.date)}
                    className={`
                      relative p-3 border-r border-b border-slate-50 transition-all cursor-pointer group
                      ${day.isPadding ? 'bg-slate-50/20 opacity-40' : 'hover:bg-slate-50/50'}
                      ${isSelected ? 'bg-primary/[0.02] ring-1 ring-inset ring-primary/20 z-10' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`
                        text-xs font-black w-7 h-7 flex items-center justify-center rounded-full transition-all
                        ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-slate-400 group-hover:text-slate-600'}
                      `}>
                        {day.date.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <div
                          key={idx}
                          className={`
                            px-2 py-1 rounded-lg border text-[9px] font-bold truncate transition-all 
                            hover:scale-[1.02] flex items-center justify-between gap-1.5 ring-1 ring-inset
                            ${event.color}
                          `}
                        >
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <span className="shrink-0 opacity-60">{event.icon}</span>
                            <span className="truncate">{event.title}</span>
                          </div>
                          {event.start_time && (
                            <span className="opacity-60 tabular-nums shrink-0">{event.start_time.substring(0, 5)}</span>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-1.5 py-0.5">
                          + {dayEvents.length - 3} more
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Filters Card */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Filter size={14} />
                Filters
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { id: 'class', label: 'Regular Classes', color: 'bg-indigo-500' },
                { id: 'exam', label: 'Examinations', color: 'bg-purple-500' },
                { id: 'birthday', label: 'Birthdays', color: 'bg-rose-500' },
                { id: 'event', label: 'School Events', color: 'bg-emerald-500' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-sm font-bold
                    ${activeFilters.includes(filter.id)
                      ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10 translate-x-1'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}
                  `}
                >
                  <div className={`w-2 h-2 rounded-full ${activeFilters.includes(filter.id) ? 'bg-white' : filter.color}`} />
                  {filter.label}
                  {activeFilters.includes(filter.id) && <div className="ml-auto w-1 h-1 bg-white rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Info / Day Details */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm min-h-[300px]">
            {selectedDay ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-slate-900 font-black text-lg mb-1">
                    {selectedDay.toLocaleDateString('default', { day: 'numeric', month: 'long' })}
                  </h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    {selectedDay.toLocaleDateString('default', { weekday: 'long' })}
                  </p>
                </div>

                <div className="space-y-4">
                  {getDayEvents(selectedDay).length > 0 ? (
                    getDayEvents(selectedDay).map((event, idx) => (
                      <div key={idx} className="group cursor-pointer">
                        <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${event.color}`}>
                          <div className="p-2 bg-white/50 rounded-xl">
                            {event.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm leading-tight mb-1">{event.title}</p>
                            <p className="text-[10px] opacity-70 font-bold uppercase tracking-tight truncate">{event.subtitle}</p>
                            {event.start_time && (
                              <p className="text-[10px] mt-2 font-black flex items-center gap-1.5">
                                <div className="p-1 bg-white/50 rounded-md">
                                  <Clock size={10} />
                                </div>
                                {event.start_time.substring(0, 5)} - {event.end_time.substring(0, 5)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 opacity-50">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon size={20} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest">No Events</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6 text-slate-300">
                  <CalendarIcon size={32} />
                </div>
                <p className="text-slate-900 font-black mb-2">Select a date</p>
                <p className="text-slate-400 text-xs font-medium px-4">Click any day on the calendar to view its full schedule and events.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

