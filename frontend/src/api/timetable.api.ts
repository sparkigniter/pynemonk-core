import { get, post, del, request } from "./base.api";

const BASE_PATH = "/school/timetable";

export interface TimetableEntry {
    id?: number;
    classroom_id: number;
    subject_id: number;
    teacher_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    subject_name?: string;
    teacher_name?: string;
    classroom_name?: string;
}

export const TimetableApi = {
    getByClassroom: (classroomId: number) =>
        get<TimetableEntry[]>(`${BASE_PATH}/classroom/${classroomId}`),

    getSuggestions: (teacherId: number, classroomId: number, day: number) =>
        get<{ start_time: string, end_time: string }[]>(`${BASE_PATH}/suggestions?teacher_id=${teacherId}&classroom_id=${classroomId}&day=${day}`),

    getTeacherSchedule: (teacherId: number, day: number) =>
        get<TimetableEntry[]>(`${BASE_PATH}/teacher-schedule?teacher_id=${teacherId}&day=${day}`),

    create: (entry: TimetableEntry) =>
        post<TimetableEntry>(BASE_PATH, entry),

    update: (id: number, entry: Partial<TimetableEntry>) =>
        request<TimetableEntry>(`${BASE_PATH}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entry),
        }),

    delete: (id: number) =>
        del(`${BASE_PATH}/${id}`)
};
