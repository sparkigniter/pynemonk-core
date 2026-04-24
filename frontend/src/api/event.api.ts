import { get, post, put, del } from './base.api';

export interface SchoolEvent {
    id?: number;
    title: string;
    description?: string;
    event_type: 'holiday' | 'meeting' | 'function' | 'general' | 'staff_birthday' | 'period' | 'exam';
    start_date: string;
    end_date: string;
    color?: string;
}

export const eventApi = {
    getEvents: () => get<SchoolEvent[]>('/school/events'),
    createEvent: (data: Partial<SchoolEvent>) => post<SchoolEvent>('/school/events', data),
    updateEvent: (id: number, data: Partial<SchoolEvent>) => put<SchoolEvent>(`/school/events/${id}`, data),
    deleteEvent: (id: number) => del(`/school/events/${id}`),
};
