import { get, post, patch } from './base.api';

export interface CommunicationTicket {
    id: number;
    student_id: number;
    teacher_id: number;
    guardian_id: number;
    title: string;
    type: 'complaint' | 'query';
    status: 'open' | 'resolved' | 'closed';
    category: 'academic' | 'behavioral' | 'attendance' | 'general';
    student_name: string;
    student_avatar?: string;
    teacher_name: string;
    guardian_name: string;
    message_count: number;
    created_at: string;
    updated_at: string;
}

export interface CommunicationMessage {
    id: number;
    ticket_id: number;
    sender_id: number;
    message: string;
    attachment_url?: string | null;
    sender_email: string;
    sender_name: string;
    sender_role: 'teacher' | 'parent' | 'admin';
    created_at: string;
}

export interface RecipientOption {
    teacher_id?: number;
    teacher_name?: string;
    subject_name?: string;
    student_id: number;
    student_name: string;
    guardian_id?: number;
    guardian_name?: string;
    relation?: string;
}

export interface RecipientOptionsResponse {
    role: 'guardian' | 'teacher' | 'admin';
    options: RecipientOption[];
}

export const communicationApi = {
    getRecipientOptions: () => get<RecipientOptionsResponse>('/school/communications/recipient-options'),
    listTickets: () => get<CommunicationTicket[]>('/school/communications/tickets'),
    createTicket: (data: {
        student_id: number;
        teacher_id?: number;
        guardian_id?: number;
        title: string;
        type: 'complaint' | 'query';
        category: 'academic' | 'behavioral' | 'attendance' | 'general';
        initialMessage: string;
    }) => post<CommunicationTicket>('/school/communications/tickets', data),
    listMessages: (ticketId: number) => get<CommunicationMessage[]>(`/school/communications/tickets/${ticketId}/messages`),
    reply: (ticketId: number, message: string) => post<CommunicationMessage>(`/school/communications/tickets/${ticketId}/messages`, { message }),
    updateStatus: (ticketId: number, status: 'open' | 'resolved' | 'closed') => patch<CommunicationTicket>(`/school/communications/tickets/${ticketId}/status`, { status }),
};
