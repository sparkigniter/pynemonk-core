export type Role = 'parent' | 'teacher'
export type TeacherView = 'home' | 'classes' | 'class_detail' | 'attendance' | 'calendar' | 'exams' | 'profile' | 'homework' | 'homework_new' | 'schedule' | 'inbox' | 'more' | 'planner' | 'notices'
export type ParentView = 'home' | 'attendance' | 'exams' | 'faculty' | 'homework' | 'notices' | 'inbox'
export type AssignmentType = 'practice' | 'homework' | 'test' | 'project'
export type BlockType = 'instructions' | 'question' | 'mcq' | 'attachment' | 'link'

export interface Block {
    id: string;
    type: BlockType;
    content: any;
}

export const TEMPLATES: Record<string, { title: string; blocks: Block[] }> = {
    practice: {
        title: 'Weekly Practice Worksheet',
        blocks: [
            { id: '1', type: 'instructions', content: 'Complete the following exercises to reinforce this week\'s concepts.' },
            { id: '2', type: 'question', content: 'Solve for x: 2x + 5 = 15' },
            { id: '3', type: 'question', content: 'What is the capital of France?' }
        ]
    },
    reading: {
        title: 'Reading Reflection Task',
        blocks: [
            { id: '1', type: 'instructions', content: 'Read Chapter 4 of the textbook and answer the reflection questions below.' },
            { id: '2', type: 'link', content: { url: 'https://pynemonk.com/library', label: 'E-Library Access' } },
            { id: '3', type: 'question', content: 'Summarize the main conflict in the chapter.' }
        ]
    },
    project: {
        title: 'Mid-Term Research Project',
        blocks: [
            { id: '1', type: 'instructions', content: 'Follow the rubric attached to complete your research project.' },
            { id: '2', type: 'attachment', content: { name: 'Project_Rubric.pdf', url: '#' } },
            { id: '3', type: 'question', content: 'Project Title & Objectives' }
        ]
    },
    test: {
        title: 'Quick Assessment',
        blocks: [
            { id: '1', type: 'mcq', content: { question: 'Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correct: 1 } },
            { id: '2', type: 'mcq', content: { question: 'What is 15 * 3?', options: ['30', '45', '60', '75'], correct: 1 } }
        ]
    }
};

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  admission_no: string;
  classroom_name?: string;
  grade_name?: string;
  roll_number?: string;
  gender?: string;
}

export interface Assignment {
  classroom_id: number;
  classroom_name: string;
  grade_name: string;
  subject_name: string;
  subject_id: number;
  is_class_teacher: boolean;
  is_scheduled_today: boolean;
  can_take_attendance: boolean;
}

export interface TimetableItem {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classroom_name: string;
  subject_name: string;
}

export interface ExamItem {
  id: number;
  exam_id: number;
  exam_name: string;
  subject_name: string;
  classroom_name: string;
  exam_date: string;
}

export interface Homework {
  id: number;
  title: string;
  description: string;
  due_date: string;
  subject_name: string;
  classroom_name: string;
  attachment_url?: string;
  created_at: string;
  status?: string;
}

export interface TeacherDashboardData {
  stats: {
    absent_today: number;
    upcoming_exams: number;
    notes_sent_24h: number;
  };
  assignments: Assignment[];
}
