import { get, post, put, del } from './base.api';

export interface Announcement {
    id: number;
    classroom_id?: number | null;
    title: string;
    content: string;
    published_by: number;
    publish_date: string;
    expiry_date?: string | null;
    publisher_name?: string;
    classroom_name?: string;
    created_at: string;
    updated_at: string;
}

export const announcementApi = {
    list: () => get<Announcement[]>('/school/announcements'),
    create: (data: Partial<Announcement>) => post<Announcement>('/school/announcements', data),
    update: (id: number, data: Partial<Announcement>) => put<Announcement>(`/school/announcements/${id}`, data),
    delete: (id: number) => del<void>(`/school/announcements/${id}`),
};
