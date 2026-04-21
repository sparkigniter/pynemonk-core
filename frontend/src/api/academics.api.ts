import { get, post } from './base.api';

export const academicsApi = {
    getRolloverPreview: async (sourceYearId: number) => {
        return get<any>(`/school/academics/rollover/preview?source_year_id=${sourceYearId}`);
    },

    executeRollover: async (data: {
        source_year_id: number;
        target_year_id: number;
        options: {
            clone_classrooms: boolean;
            clone_assignments: boolean;
            promote_students: boolean;
        }
    }) => {
        return post<any>('/school/academics/rollover/execute', data);
    },

    getYears: async () => {
        return get<any[]>('/school/academics/years');
    },

    createYear: async (data: { name: string; start_date: string; end_date: string }) => {
        return post<any>('/school/academics/years', data);
    }
};
