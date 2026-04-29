import { get, post } from './base.api';

export const getAttendanceRoster = async (classroomId: number, date: string) => {
    return await get<any>(`/school/attendance/roster/${classroomId}?date=${date}`);
};

export const saveAttendance = async (date: string, records: any[]) => {
    return await post<any>(`/school/attendance/save`, { date, records });
};
