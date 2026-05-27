import { injectable, inject } from "tsyringe";
import { ExamHelper } from "../helpers/ExamHelper.js";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";

@injectable()
export class ExamService {
    constructor(
        private examHelper: ExamHelper,
        private academicYearHelper: AcademicYearHelper
    ) { }

    // ─── Terms ───────────────────────────────────────────────────────────────

    public async getTerms(tenantId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        if (!academicYearId) throw new Error("No active academic year found");
        return this.examHelper.findAllTerms(tenantId, academicYearId);
    }

    public async addTerm(tenantId: number, data: any) {
        if (!data.academic_year_id) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            data.academic_year_id = currentYear?.id;
        }
        if (!data.academic_year_id) throw new Error("No active academic year found");
        return this.examHelper.createTerm({ ...data, tenant_id: tenantId });
    }

    // ─── Exams ───────────────────────────────────────────────────────────────

    public async getExams(tenantId: number, academicYearId?: number, examIds?: number[], classroomId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        if (!academicYearId) throw new Error("No active academic year found");
        return this.examHelper.findAllExams(tenantId, academicYearId, examIds, classroomId);
    }

    public async addExam(tenantId: number, data: any) {
        if (!data.academic_year_id) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            data.academic_year_id = currentYear?.id;
        }
        if (!data.academic_year_id) throw new Error("No active academic year found");

        const exam = await this.examHelper.createExam({ ...data, tenant_id: tenantId });

        // If invitations (grades/classrooms) are provided during creation, add them
        if (data.invitations && Array.isArray(data.invitations)) {
            for (const inv of data.invitations) {
                await this.examHelper.createInvitation({
                    ...inv,
                    tenant_id: tenantId,
                    exam_id: exam.id
                });
            }
        }

        return exam;
    }

    public async getExamDetails(tenantId: number, id: number) {
        const exam = await this.examHelper.findById(tenantId, id);
        if (!exam) return null;

        const papers = await this.examHelper.findPapersByExam(tenantId, id);
        const invitations = await this.examHelper.findInvitationsByExam(tenantId, id);
        const students = await this.examHelper.getInvitedStudents(tenantId, id);

        return { ...exam, papers, invitations, students };
    }

    // ─── Papers & Invitations ───────────────────────────────────────────────

    public async addPaper(tenantId: number, data: any) {
        if (data.id) {
            return this.examHelper.updatePaper(tenantId, data.id, data);
        }
        return this.examHelper.createPaper({ ...data, tenant_id: tenantId });
    }

    public async deletePaper(tenantId: number, paperId: number) {
        return this.examHelper.deletePaper(tenantId, paperId);
    }

    public async addInvitation(tenantId: number, data: any) {
        return this.examHelper.createInvitation({ ...data, tenant_id: tenantId });
    }

    public async updateStudentStatus(tenantId: number, examId: number, studentId: number, data: any) {
        return this.examHelper.upsertExamStudent({
            ...data,
            tenant_id: tenantId,
            exam_id: examId,
            student_id: studentId
        });
    }

    public async getPaperStudents(tenantId: number, examId: number, paperId: number, classroomIds?: number[]) {
        const students = await this.examHelper.getInvitedStudents(tenantId, examId, paperId, classroomIds);
        const marks = await this.examHelper.getMarksByPaper(tenantId, paperId);

        // Map marks to students
        return students.map((s: any) => ({
            ...s,
            marks: marks.find((m: any) => m.student_id === s.student_id) || null
        }));
    }

    public async getPaginatedStudents(tenantId: number, examId: number, filters: any) {
        return this.examHelper.getPaginatedInvitedStudents(tenantId, examId, filters);
    }

    public async saveMarks(tenantId: number, examId: number, paperId: number, marksData: any[], userId: number) {
        for (const item of marksData) {
            await this.examHelper.saveMarks(tenantId, {
                ...item,
                exam_id: examId,
                paper_id: paperId,
                created_by: userId
            });
        }
        return { success: true };
    }

    public async updateStatus(tenantId: number, examId: number, status: string) {
        return this.examHelper.updateExamStatus(tenantId, examId, status);
    }

    public async updateExam(tenantId: number, id: number, data: any) {
        return this.examHelper.updateExam(tenantId, id, data);
    }

    public async getExamResults(tenantId: number, examId: number) {
        return this.examHelper.getExamResults(tenantId, examId);
    }

    public async getDashboardStats(tenantId: number, userId: number, examIds?: number[]) {
        return this.examHelper.getExamDashboardStats(tenantId, undefined, examIds); // Base version, controller can pass staffId if needed
    }

    public async getStudentPerformance(tenantId: number, studentId: number) {
        // Fetch all marks for this student
        const query = `
            SELECT 
                COALESCE(ay.name, 'Unknown Year') as academic_year,
                COALESCE(et.name, 'General') as term_name,
                e.name as exam_name,
                e.exam_type,
                s.name as subject_name,
                s.code as subject_code,
                ep.max_marks,
                ep.passing_marks,
                em.marks_obtained,
                em.is_absent
            FROM school.exam_marks em
            JOIN school.exam e ON em.exam_id = e.id
            JOIN school.exam_paper ep ON em.paper_id = ep.id
            JOIN school.subject s ON ep.subject_id = s.id
            LEFT JOIN school.exam_term et ON e.exam_term_id = et.id
            LEFT JOIN school.academic_year ay ON e.academic_year_id = ay.id
            WHERE em.tenant_id = $1 AND em.student_id = $2 AND e.is_deleted = FALSE
            ORDER BY ay.start_date DESC, et.created_at DESC, e.start_date DESC
        `;
        const res = await (this.examHelper as any).db.query(query, [tenantId, studentId]);
        
        // Group by Academic Year
        const performance: any = {};
        res.rows.forEach((row: any) => {
            if (!performance[row.academic_year]) {
                performance[row.academic_year] = {
                    year: row.academic_year,
                    terms: {}
                };
            }
            if (!performance[row.academic_year].terms[row.term_name]) {
                performance[row.academic_year].terms[row.term_name] = {
                    name: row.term_name,
                    exams: {}
                };
            }
            if (!performance[row.academic_year].terms[row.term_name].exams[row.exam_name]) {
                performance[row.academic_year].terms[row.term_name].exams[row.exam_name] = {
                    name: row.exam_name,
                    type: row.exam_type,
                    subjects: []
                };
            }
            performance[row.academic_year].terms[row.term_name].exams[row.exam_name].subjects.push({
                subject: row.subject_name,
                code: row.subject_code,
                marks: row.marks_obtained,
                max: row.max_marks,
                passing: row.passing_marks,
                is_absent: row.is_absent
            });
        });

        return Object.values(performance);
    }

    // ─── Question Paper Auto-Generation & Management ─────────────────────────

    public async getPaperQuestions(tenantId: number, paperId: number) {
        const sections = await this.examHelper.getPaperSections(tenantId, paperId);
        const questions = await this.examHelper.getPaperQuestions(tenantId, paperId);

        // Group questions by section_id
        return sections.map((sec: any) => ({
            ...sec,
            questions: questions
                .filter((q: any) => q.section_id === sec.id)
                .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
        }));
    }

    public async savePaperQuestions(tenantId: number, paperId: number, sections: any[]) {
        // Clear all existing sections and questions first
        await this.examHelper.clearPaperSections(tenantId, paperId);

        const savedSections = [];
        for (let i = 0; i < sections.length; i++) {
            const secData = sections[i];
            const sec = await this.examHelper.createPaperSection(paperId, secData.section_name, secData.instructions, i);
            
            const savedQuestions = [];
            if (secData.questions && Array.isArray(secData.questions)) {
                for (let j = 0; j < secData.questions.length; j++) {
                    const qData = secData.questions[j];
                    const q = await this.examHelper.addQuestionToSection(sec.id, qData.question_id, j, qData.marks_allocated);
                    savedQuestions.push(q);
                }
            }
            savedSections.push({ ...sec, questions: savedQuestions });
        }
        return savedSections;
    }

    public async generateQuestionPaper(tenantId: number, paperId: number, config: {
        chapters?: number[];
        difficulty_distribution?: { EASY: number; MEDIUM: number; HARD: number };
        sections: Array<{
            name: string;
            type: string; // MCQ, DESCRIPTIVE, FILL_IN
            count: number;
            marks_per_question: number;
            instructions?: string;
        }>;
    }) {
        // 1. Fetch the exam paper to verify subject_id
        const subjectId = await this.examHelper.getPaperSubjectId(tenantId, paperId);
        if (!subjectId) {
            throw new Error("Exam paper not found");
        }

        // 2. Fetch all available questions in the question bank for this subject & chapters
        const questionPool = await this.examHelper.getQuestionBankPool(tenantId, subjectId, config.chapters);
        if (questionPool.length === 0) {
            throw new Error("No questions found in the question bank matching the selected criteria.");
        }

        // 3. Set default difficulty distribution if not provided
        const diffDist = config.difficulty_distribution || { EASY: 40, MEDIUM: 40, HARD: 20 };
        const totalPct = diffDist.EASY + diffDist.MEDIUM + diffDist.HARD;
        if (totalPct !== 100) {
            throw new Error("Difficulty distribution percentages must sum to 100%");
        }

        // 4. Calculate total target count of questions to determine targets per difficulty
        let totalQuestions = 0;
        config.sections.forEach(s => totalQuestions += s.count);

        const targetEasy = Math.round(totalQuestions * (diffDist.EASY / 100));
        const targetHard = Math.round(totalQuestions * (diffDist.HARD / 100));
        const targetMedium = totalQuestions - targetEasy - targetHard;

        let selectedQuestionIds = new Set<number>();
        const generatedSections: any[] = [];

        // Shuffle question pool to ensure variety/randomness
        const shuffledPool = [...questionPool].sort(() => Math.random() - 0.5);

        let currentEasy = 0;
        let currentMedium = 0;
        let currentHard = 0;

        for (let i = 0; i < config.sections.length; i++) {
            const secConfig = config.sections[i];
            const sectionQuestions: any[] = [];

            // Filter questions from pool that match section type and are not already selected
            const eligibleQuestions = shuffledPool.filter(q => 
                q.question_type.toUpperCase() === secConfig.type.toUpperCase() && 
                !selectedQuestionIds.has(q.id)
            );

            // Attempt to select questions satisfying counts and difficulty distribution
            let countSelected = 0;
            
            while (countSelected < secConfig.count) {
                // Find shortfall
                let preferredDifficulty = 'MEDIUM';
                if (currentEasy < targetEasy && (currentEasy - targetEasy <= currentMedium - targetMedium) && (currentEasy - targetEasy <= currentHard - targetHard)) {
                    preferredDifficulty = 'EASY';
                } else if (currentHard < targetHard && (currentHard - targetHard <= currentEasy - targetEasy) && (currentHard - targetHard <= currentMedium - targetMedium)) {
                    preferredDifficulty = 'HARD';
                }

                // Find a question in eligible matching preferred difficulty
                let nextQ = eligibleQuestions.find(q => 
                    q.difficulty.toUpperCase() === preferredDifficulty && 
                    !selectedQuestionIds.has(q.id)
                );

                // If not found, fall back to any difficulty
                if (!nextQ) {
                    nextQ = eligibleQuestions.find(q => !selectedQuestionIds.has(q.id));
                }

                if (!nextQ) {
                    // No more questions of this type left in pool!
                    break;
                }

                selectedQuestionIds.add(nextQ.id);
                sectionQuestions.push({
                    question_id: nextQ.id,
                    marks_allocated: secConfig.marks_per_question,
                    ...nextQ
                });

                // Increment counts
                if (nextQ.difficulty.toUpperCase() === 'EASY') currentEasy++;
                else if (nextQ.difficulty.toUpperCase() === 'HARD') currentHard++;
                else currentMedium++;

                countSelected++;
            }

            generatedSections.push({
                section_name: secConfig.name,
                instructions: secConfig.instructions || `Answer all questions in this section.`,
                questions: sectionQuestions
            });
        }

        // 5. Save the generated sections and questions to the database
        return this.savePaperQuestions(tenantId, paperId, generatedSections);
    }
}
