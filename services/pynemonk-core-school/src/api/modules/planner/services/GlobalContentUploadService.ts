import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';
import * as xlsx from 'xlsx';

@injectable()
export class GlobalContentUploadService {
    constructor(@inject('DB') private pool: Pool) {}

    /**
     * Parses an uploaded Excel file to bulk-insert Syllabus, Chapters, and Topics
     * Expected Excel columns: 
     * [Chapter Sequence, Chapter Title, Recommended Periods, Topic Sequence, Topic Title, Learning Outcomes]
     */
    async uploadMasterSyllabus(
        boardName: string, 
        gradeName: string, 
        subjectName: string, 
        academicYear: string,
        fileBuffer: Buffer
    ) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // 1. Resolve or Create the taxonomy IDs (Board, Grade, Subject)
            const boardId = await this.resolveTaxonomyId(client, 'global_board', boardName);
            const gradeId = await this.resolveTaxonomyId(client, 'global_grade', gradeName);
            const subjectId = await this.resolveTaxonomyId(client, 'global_subject', subjectName);

            // 2. Resolve or Create the Global Syllabus entry
            const syllabusRes = await client.query(
                `INSERT INTO school.global_syllabus (board_id, grade_id, subject_id, academic_year, is_published)
                 VALUES ($1, $2, $3, $4, TRUE)
                 ON CONFLICT (board_id, grade_id, subject_id, academic_year) 
                 DO UPDATE SET updated_at = NOW(), is_published = TRUE
                 RETURNING id`,
                [boardId, gradeId, subjectId, academicYear]
            );
            const syllabusId = syllabusRes.rows[0].id;

            // 3. Parse the Excel File
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Expected Format: Array of objects matching header row
            const rows = xlsx.utils.sheet_to_json<any>(worksheet);

            // 4. Process Rows (Grouping Topics under Chapters)
            let currentChapterId: number | null = null;
            let currentChapterTitle: string | null = null;
            let totalPeriods = 0;

            for (const row of rows) {
                const chapterTitle = row['Chapter Title']?.trim();
                const chapterSeq = parseInt(row['Chapter Sequence']) || 1;
                const recPeriods = parseInt(row['Recommended Periods']) || 1;

                const topicTitle = row['Topic Title']?.trim();
                const topicSeq = parseInt(row['Topic Sequence']) || 1;
                const learningOutcomes = row['Learning Outcomes']?.trim() || '';

                if (!chapterTitle || !topicTitle) continue;

                // If we encounter a new chapter, insert it
                if (chapterTitle !== currentChapterTitle) {
                    const chapterRes = await client.query(
                        `INSERT INTO school.global_chapter 
                         (syllabus_id, title, sequence_order, recommended_periods)
                         VALUES ($1, $2, $3, $4)
                         RETURNING id`,
                        [syllabusId, chapterTitle, chapterSeq, recPeriods]
                    );
                    currentChapterId = chapterRes.rows[0].id;
                    currentChapterTitle = chapterTitle;
                    totalPeriods += recPeriods;
                }

                // Insert the Topic under the current Chapter
                if (currentChapterId) {
                    await client.query(
                        `INSERT INTO school.global_topic 
                         (chapter_id, title, sequence_order, learning_outcomes)
                         VALUES ($1, $2, $3, $4)`,
                        [currentChapterId, topicTitle, topicSeq, learningOutcomes]
                    );
                }
            }

            // Update Total Recommended Hours on the Syllabus Level
            await client.query(
                `UPDATE school.global_syllabus SET total_recommended_hours = $1 WHERE id = $2`,
                [totalPeriods, syllabusId]
            );

            await client.query('COMMIT');
            return { success: true, message: `Successfully processed ${rows.length} rows into syllabus ID: ${syllabusId}.`, syllabusId };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Parses an uploaded Excel file to bulk-insert Questions into the Question Bank
     * Expected Excel columns:
     * [Topic Title, Question Type, Difficulty, Taxonomy Level, Question Text, Option A, Option B, Option C, Option D, Answer Key, Marks]
     */
    async uploadQuestionBank(fileBuffer: Buffer) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json<any>(worksheet);

            let importedCount = 0;

            for (const row of rows) {
                const topicTitle = row['Topic Title']?.trim();
                if (!topicTitle) continue;

                // Attempt to find the topic by exact name (In a real system, you might require a topic_id mapping)
                const topicRes = await client.query(
                    `SELECT id FROM school.global_topic WHERE title ILIKE $1 LIMIT 1`,
                    [topicTitle]
                );
                
                if (topicRes.rows.length === 0) continue; // Skip if topic doesn't exist
                const topicId = topicRes.rows[0].id;

                const qType = row['Question Type']?.trim().toUpperCase() || 'MCQ';
                const difficulty = row['Difficulty']?.trim().toUpperCase() || 'MEDIUM';
                const taxonomy = row['Taxonomy Level']?.trim().toUpperCase() || 'KNOWLEDGE';
                const qText = row['Question Text']?.trim();
                const ansKey = row['Answer Key']?.trim() || '';
                const marks = parseFloat(row['Marks']) || 1.0;

                // Construct options JSON for MCQs
                let optionsJson = null;
                if (qType === 'MCQ') {
                    optionsJson = {
                        "A": row['Option A']?.trim() || '',
                        "B": row['Option B']?.trim() || '',
                        "C": row['Option C']?.trim() || '',
                        "D": row['Option D']?.trim() || ''
                    };
                }

                if (qText) {
                    await client.query(
                        `INSERT INTO school.question_bank 
                         (topic_id, question_type, difficulty, taxonomy_level, question_text, options, answer_key, marks)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [topicId, qType, difficulty, taxonomy, qText, optionsJson, ansKey, marks]
                    );
                    importedCount++;
                }
            }

            await client.query('COMMIT');
            return { success: true, importedCount };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // --- Helper function to dynamically map taxonomy strings to IDs ---
    private async resolveTaxonomyId(client: any, tableName: string, nameValue: string): Promise<number> {
        const checkRes = await client.query(`SELECT id FROM school.${tableName} WHERE name ILIKE $1`, [nameValue.trim()]);
        
        if (checkRes.rows.length > 0) {
            return checkRes.rows[0].id;
        }

        // If it doesn't exist, create it. 
        const insertRes = await client.query(
            `INSERT INTO school.${tableName} (name) VALUES ($1) RETURNING id`,
            [nameValue.trim()]
        );
        return insertRes.rows[0].id;
    }
}
