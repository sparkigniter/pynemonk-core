import { get, post } from './base.api';

export const getAttendanceRoster = async (classroomId: number, date: string) => {
    return await get<any>(`/school/attendance/roster/${classroomId}?date=${date}`);
};

export const saveAttendance = async (date: string, classroom_id: number, records: any[], subject_id?: number) => {
    return await post<any>(`/school/attendance/save`, { date, classroom_id, subject_id, records });
};
