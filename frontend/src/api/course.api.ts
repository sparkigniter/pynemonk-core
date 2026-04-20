import { request } from './base.api';

export interface Course {
    id: number;
    name: string;
    code: string;
    description: string;
    created_at: string;
}

export async function getCourseList(): Promise<Course[]> {
    return request<Course[]>('/school/courses');
}

export async function createCourse(data: Partial<Course>): Promise<Course> {
    return request<Course>('/school/courses', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
