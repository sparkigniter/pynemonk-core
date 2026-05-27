import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/pynemonk-monolith/.env') });

const isDocker = fs.existsSync('/.dockerenv');

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: isDocker ? 'postgres' : (process.env.PGHOST || 'localhost'),
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432'),
});

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];
const GRADES = [
    'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 
    'Grade 10', 'Grade 11', 'Grade 12'
];
const SUBJECTS = [
    'English', 'Mathematics', 'Science', 'Social Science', 
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 
    'Environmental Studies (EVS)', 'Hindi', 'Sanskrit'
];

// Helper to generate realistic chapters and topics based on Grade and Subject
function getSyllabusContent(grade: string, subject: string): { title: string; description: string; recommended_periods: number; topics: string[] }[] {
    const isPrimary = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].includes(grade);
    const isMiddle = ['Grade 6', 'Grade 7', 'Grade 8'].includes(grade);
    const isSecondary = ['Grade 9', 'Grade 10'].includes(grade);
    const isSenior = ['Grade 11', 'Grade 12'].includes(grade);

    if (subject === 'Mathematics') {
        if (isPrimary) {
            return [
                { title: 'Numbers and Counting', description: 'Understanding place value, comparing numbers, and base ten system.', recommended_periods: 12, topics: ['Introduction to Numbers', 'Place Value and Face Value', 'Comparing and Ordering Numbers', 'Skip Counting'] },
                { title: 'Addition & Subtraction', description: 'Single and multi-digit addition and subtraction concepts.', recommended_periods: 15, topics: ['Basic Addition Facts', 'Basic Subtraction Facts', 'Addition with Regrouping', 'Word Problems'] },
                { title: 'Shapes & Symmetry', description: 'Identifying basic 2D and 3D shapes and patterns.', recommended_periods: 10, topics: ['Flat 2D Shapes', 'Solid 3D Shapes', 'Line of Symmetry', 'Geometric Patterns'] },
                { title: 'Fractions Introduction', description: 'Visualizing and understanding halves, thirds, and quarters.', recommended_periods: 8, topics: ['Equal Parts', 'Halves and Quarters', 'Numerator and Denominator', 'Comparing Simple Fractions'] }
            ];
        } else if (isMiddle) {
            return [
                { title: 'Integers & Fractions', description: 'Properties and operations of integers, fractions, and decimals.', recommended_periods: 14, topics: ['Integers on Number Line', 'Operations on Integers', 'Multiplication of Fractions', 'Division of Decimals'] },
                { title: 'Algebraic Expressions', description: 'Formulation, addition, subtraction, and simple linear equations.', recommended_periods: 16, topics: ['Variables and Constants', 'Like and Unlike Terms', 'Solving Linear Equations', 'Applications of Linear Equations'] },
                { title: 'Lines and Angles', description: 'Properties of parallel lines, transversal, and complementary/supplementary angles.', recommended_periods: 12, topics: ['Types of Angles', 'Pairs of Angles', 'Parallel Lines and Transversal', 'Angle Sum Property of Triangles'] },
                { title: 'Data Handling', description: 'Organizing data, calculating central tendencies, and drawing bar graphs.', recommended_periods: 10, topics: ['Arithmetic Mean', 'Median and Mode', 'Bar Graphs', 'Probability Introduction'] }
            ];
        } else {
            return [
                { title: 'Number Systems & Real Numbers', description: 'Irrational numbers, real numbers representation, and Euclid division lemma.', recommended_periods: 10, topics: ['Irrational Numbers', 'Real Numbers and Decimal Expansions', 'Laws of Exponents for Real Numbers', 'Fundamental Theorem of Arithmetic'] },
                { title: 'Polynomials', description: 'Zeros of a polynomial, factorization, and algebraic identities.', recommended_periods: 15, topics: ['Geometrical Meaning of Zeros', 'Relationship Between Coefficients', 'Division Algorithm for Polynomials', 'Factorization of Polynomials'] },
                { title: 'Quadratic Equations', description: 'Solving quadratic equations using factorization and quadratic formula.', recommended_periods: 18, topics: ['Introduction to Quadratic Equations', 'Solution by Factorization', 'Completing the Square Method', 'Nature of Roots'] },
                { title: 'Trigonometry Introduction', description: 'Trigonometric ratios, values for specific angles, and identities.', recommended_periods: 15, topics: ['Trigonometric Ratios', 'Ratios of Complementary Angles', 'Trigonometric Identities', 'Applications: Height and Distance'] }
            ];
        }
    }

    if (subject === 'Science') {
        if (isPrimary) {
            return [
                { title: 'Living vs Non-Living Things', description: 'Characteristics of living things and classification.', recommended_periods: 8, topics: ['What are Living Things', 'Needs of Living Things', 'Natural vs Man-Made', 'Plants and Animals around us'] },
                { title: 'Our Body & Health', description: 'Sensory organs, primary organ systems, and healthy hygiene.', recommended_periods: 10, topics: ['The Five Senses', 'Our Bones and Muscles', 'Healthy Food Habits', 'Daily Hygiene Practices'] },
                { title: 'Force, Work & Energy', description: 'Simple push and pull concepts, gravity, and renewable energy.', recommended_periods: 10, topics: ['What is Force', 'Types of Forces', 'Simple Machines', 'Sources of Energy'] }
            ];
        } else if (isMiddle) {
            return [
                { title: 'Nutrition in Plants & Animals', description: 'Photosynthesis, autotrophic and heterotrophic modes, and digestion.', recommended_periods: 12, topics: ['Autotrophic Nutrition', 'Heterotrophic Nutrition', 'Human Digestive System', 'Digestion in Herbivores'] },
                { title: 'Acids, Bases & Salts', description: 'Physical and chemical properties, pH indicators, and neutralization.', recommended_periods: 12, topics: ['Natural Indicators', 'Properties of Acids and Bases', 'Neutralization Reaction', 'Salts in Everyday Life'] },
                { title: 'Motion and Time', description: 'Measurement of speed, uniform/non-uniform motion, and simple pendulum.', recommended_periods: 10, topics: ['Slow and Fast Motion', 'Speed and its Formula', 'Simple Pendulum', 'Distance-Time Graphs'] },
                { title: 'Electric Current & Effects', description: 'Circuit diagrams, heating effect, magnetic effect, and electromagnetism.', recommended_periods: 12, topics: ['Electric Circuit Symbols', 'Heating Effect of Current', 'Electric Fuse', 'Electromagnets'] }
            ];
        } else {
            return [
                { title: 'Chemical Reactions', description: 'Writing chemical equations, types of reactions, and corrosion.', recommended_periods: 14, topics: ['Chemical Equation Balancing', 'Combination & Decomposition Reactions', 'Displacement & Double Displacement', 'Oxidation and Reduction'] },
                { title: 'Life Processes', description: 'Nutrition, respiration, transportation, and excretion in plants/humans.', recommended_periods: 20, topics: ['Human Nutrition', 'Respiration Mechanisms', 'Double Circulation in Humans', 'Excretory System'] },
                { title: 'Light: Reflection & Refraction', description: 'Mirror formula, spherical lenses, refractive index, and power.', recommended_periods: 18, topics: ['Reflection by Spherical Mirrors', 'Refraction through Glass Slab', 'Refractive Index', 'Lens Formula and Power'] },
                { title: 'Electricity & Circuits', description: 'Ohms law, resistance in series/parallel, heating effect, and electric power.', recommended_periods: 16, topics: ['Electric Current and Circuit', 'Ohm\'s Law', 'Factors Affecting Resistance', 'Joule\'s Heating Law'] }
            ];
        }
    }

    if (subject === 'Physics') {
        return [
            { title: 'Units and Measurements', description: 'Dimensional analysis, SI units, and error estimation.', recommended_periods: 10, topics: ['SI Units and Standards', 'Dimensional Formulae', 'Accuracy and Precision', 'Propagation of Errors'] },
            { title: 'Kinematics & Motion', description: 'Motion in a straight line, projectile motion, and vector algebra.', recommended_periods: 16, topics: ['Uniformly Accelerated Motion', 'Vector Operations', 'Projectile Motion', 'Relative Velocity'] },
            { title: 'Laws of Motion', description: 'Newtonian mechanics, friction, and circular motion dynamics.', recommended_periods: 14, topics: ['Newton\'s Laws of Motion', 'Static and Kinetic Friction', 'Centripetal Force', 'Conservation of Momentum'] },
            { title: 'Work, Energy and Power', description: 'Conservative forces, work-energy theorem, and collisions.', recommended_periods: 12, topics: ['Kinetic and Potential Energy', 'Work-Energy Theorem', 'Conservation of Mechanical Energy', 'Elastic and Inelastic Collisions'] }
        ];
    }

    if (subject === 'Chemistry') {
        return [
            { title: 'Atomic Structure', description: 'Bohr\'s model, quantum numbers, and electronic configurations.', recommended_periods: 12, topics: ['Bohr\'s Model of Hydrogen', 'Heisenberg Uncertainty Principle', 'Quantum Numbers', 'Aufbau and Pauli Exclusion Principles'] },
            { title: 'Chemical Bonding', description: 'Lewis structures, VSEPR theory, hybridization, and molecular orbitals.', recommended_periods: 15, topics: ['Ionic and Covalent Bonds', 'VSEPR Theory', 'Hybridization (sp, sp2, sp3)', 'Molecular Orbital Theory'] },
            { title: 'Chemical Equilibrium', description: 'Le Chatelier\'s principle, ionic equilibrium, and solubility product.', recommended_periods: 14, topics: ['Law of Chemical Equilibrium', 'Le Chatelier\'s Principle', 'pH and Buffer Solutions', 'Solubility Product (Ksp)'] },
            { title: 'Organic Chemistry Basics', description: 'IUPAC nomenclature, isomerism, and reaction mechanisms.', recommended_periods: 18, topics: ['IUPAC Nomenclature Rules', 'Structural and Stereo Isomerism', 'Inductive and Electromeric Effects', 'Types of Organic Reactions'] }
        ];
    }

    if (subject === 'Biology') {
        return [
            { title: 'Cell Biology', description: 'Structure of cell organelles, cell cycle, and mitosis/meiosis.', recommended_periods: 14, topics: ['Prokaryotic vs Eukaryotic Cells', 'Cell Membrane and Organelles', 'Mitosis Phases', 'Meiosis and its Significance'] },
            { title: 'Genetics & Inheritance', description: 'Mendelian genetics, DNA replication, and molecular basis of inheritance.', recommended_periods: 18, topics: ['Mendel\'s Laws of Inheritance', 'DNA Structure and Replication', 'Transcription and Translation', 'Genetic Mutations'] },
            { title: 'Human Physiology', description: 'Circulatory, respiratory, nervous, and endocrine systems.', recommended_periods: 20, topics: ['Cardiac Cycle and ECG', 'Neural Control and Synapse', 'Endocrine Hormones', 'Regulation of Respiration'] },
            { title: 'Ecology & Environment', description: 'Ecosystem structure, food webs, and biodiversity conservation.', recommended_periods: 12, topics: ['Trophic Levels and Energy Flow', 'Biogeochemical Cycles', 'Biodiversity Hotspots', 'Environmental Pollution'] }
        ];
    }

    if (subject === 'English') {
        return [
            { title: 'Grammar Essentials', description: 'Tenses, active/passive voice, direct/indirect speech.', recommended_periods: 10, topics: ['Verb Tenses and Agreement', 'Active and Passive Voice', 'Direct and Indirect Speech', 'Common Grammatical Errors'] },
            { title: 'Writing Skills', description: 'Formal and informal writing techniques.', recommended_periods: 12, topics: ['Formal Letter Writing', 'Essay and Report Writing', 'Creative Writing', 'Paragraph Development'] },
            { title: 'Reading Comprehension', description: 'Developing critical reading, skimming, and scanning skills.', recommended_periods: 8, topics: ['Unseen Passage Practice', 'Identifying Themes and Tones', 'Vocabulary in Context', 'Critical Reasoning'] }
        ];
    }

    if (subject === 'Computer Science') {
        return [
            { title: 'Introduction to Programming', description: 'Basic syntax, variables, data types, and control flow.', recommended_periods: 14, topics: ['Variables and Constants', 'Conditional Statements (if-else)', 'Loops (for, while)', 'Functions and Scope'] },
            { title: 'Data Structures', description: 'Arrays, lists, dictionaries, stacks, and queues.', recommended_periods: 16, topics: ['Single and Multi-dimensional Arrays', 'Lists and Tuples', 'Dictionaries and Key-Value pairs', 'Introduction to Stacks and Queues'] },
            { title: 'Database Management', description: 'Relational databases, SQL queries, and normalization.', recommended_periods: 12, topics: ['DBMS Concepts', 'SQL SELECT and Joins', 'Primary and Foreign Keys', 'Data Normalization (1NF, 2NF)'] }
        ];
    }

    if (subject === 'Social Science') {
        return [
            { title: 'Civics and Constitution', description: 'Foundations of democracy, central/state governments, and judiciary.', recommended_periods: 12, topics: ['What is Democracy', 'Preamble of the Constitution', 'Fundamental Rights', 'The Three Branches of Government'] },
            { title: 'World Geography', description: 'Physical features, climate zones, and resources.', recommended_periods: 14, topics: ['Major Landforms', 'Climate and Weather Patterns', 'Natural Resources Distribution', 'Maps and Coordinates'] },
            { title: 'Modern History', description: 'Major historical movements and events that shaped the world.', recommended_periods: 16, topics: ['The Industrial Revolution', 'Freedom Struggles', 'Major World Wars', 'Post-War Reconstruction'] }
        ];
    }

    // Default Fallback (for Hindi, Sanskrit, EVS etc.)
    return [
        { title: 'Foundational Knowledge', description: 'Introduction to basic concepts and principles of the subject.', recommended_periods: 10, topics: ['Core Concepts Introduction', 'Basic Terminology', 'Principles & Foundations', 'Practical Applications'] },
        { title: 'Intermediate Applications', description: 'Expanding basic principles into standard real-world applications.', recommended_periods: 12, topics: ['Applying the Concepts', 'Case Studies', 'Common Methods', 'Solving Basic Problems'] },
        { title: 'Advanced Review & Synthesis', description: 'Connecting all elements together for term synthesis and review.', recommended_periods: 10, topics: ['Critical Analysis', 'Advanced Synthesis', 'Summary Review', 'End-Term Assessments'] }
    ];
}

async function seed() {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        console.log('🧹 Clearing old global syllabus library data...');
        await client.query('TRUNCATE school.global_board, school.global_grade, school.global_subject, school.global_syllabus, school.global_chapter, school.global_topic, school.topic_resource, school.question_bank CASCADE');

        // 1. Seed Global Boards
        console.log('🔌 Seeding Global Boards...');
        const boardIds: { [name: string]: number } = {};
        for (const board of BOARDS) {
            const res = await client.query('INSERT INTO school.global_board (name, description) VALUES ($1, $2) RETURNING id', [board, `${board} Central Education Blueprint Standards.`]);
            boardIds[board] = res.rows[0].id;
        }

        // 2. Seed Global Grades
        console.log('🏫 Seeding Global Grades...');
        const gradeIds: { [name: string]: number } = {};
        for (let i = 0; i < GRADES.length; i++) {
            const grade = GRADES[i];
            const res = await client.query('INSERT INTO school.global_grade (name, sequence_order) VALUES ($1, $2) RETURNING id', [grade, i + 1]);
            gradeIds[grade] = res.rows[0].id;
        }

        // 3. Seed Global Subjects
        console.log('📚 Seeding Global Subjects...');
        const subjectIds: { [name: string]: number } = {};
        for (const subject of SUBJECTS) {
            const res = await client.query('INSERT INTO school.global_subject (name) VALUES ($1) RETURNING id', [subject]);
            subjectIds[subject] = res.rows[0].id;
        }

        // 4. Seed Global Syllabus, Chapters & Topics
        console.log('🧠 Seeding blueprints (Syllabus, Chapters & Topics) for ALL combinations...');
        
        let syllabusCount = 0;
        let chapterCount = 0;
        let topicCount = 0;

        // Loop through all boards, grades, and subjects to build complete library
        for (const board of BOARDS) {
            for (const grade of GRADES) {
                // Determine relevant subjects for this grade level
                // E.g. Primary grades shouldn't have separate Physics/Chemistry/Biology (they take general 'Science')
                // E.g. High school (Grades 11, 12) have Physics/Chemistry/Biology but not EVS or general 'Science'
                const isSenior = ['Grade 11', 'Grade 12'].includes(grade);
                const isPrimary = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].includes(grade);

                let relevantSubjects = SUBJECTS;
                if (isSenior) {
                    // Exclude EVS and Science
                    relevantSubjects = SUBJECTS.filter(s => s !== 'Environmental Studies (EVS)' && s !== 'Science');
                } else {
                    // Exclude Physics, Chemistry, Biology
                    relevantSubjects = SUBJECTS.filter(s => s !== 'Physics' && s !== 'Chemistry' && s !== 'Biology');
                }

                for (const subject of relevantSubjects) {
                    const boardId = boardIds[board];
                    const gradeId = gradeIds[grade];
                    const subjectId = subjectIds[subject];

                    // Insert Syllabus
                    const content = getSyllabusContent(grade, subject);
                    const totalHours = content.reduce((sum, ch) => sum + ch.recommended_periods, 0);

                    const sylRes = await client.query(
                        `INSERT INTO school.global_syllabus (board_id, grade_id, subject_id, academic_year, total_recommended_hours, is_published)
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                        [boardId, gradeId, subjectId, '2026-27', totalHours, true]
                    );
                    const syllabusId = sylRes.rows[0].id;
                    syllabusCount++;

                    // Insert Chapters and Topics
                    for (let cIdx = 0; cIdx < content.length; cIdx++) {
                        const chapter = content[cIdx];
                        const chapRes = await client.query(
                            `INSERT INTO school.global_chapter (syllabus_id, title, description, sequence_order, recommended_periods)
                             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                            [syllabusId, chapter.title, chapter.description, cIdx + 1, chapter.recommended_periods]
                        );
                        const chapterId = chapRes.rows[0].id;
                        chapterCount++;

                        for (let tIdx = 0; tIdx < chapter.topics.length; tIdx++) {
                            const topicTitle = chapter.topics[tIdx];
                            const topicRes = await client.query(
                                `INSERT INTO school.global_topic (chapter_id, title, description, learning_outcomes, sequence_order)
                                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                                [chapterId, topicTitle, `Core lessons on ${topicTitle}.`, `Master the fundamentals and practical applications of ${topicTitle}.`, tIdx + 1]
                            );
                            const topicId = topicRes.rows[0].id;
                            topicCount++;

                            // Seed a resource for some topics to make it rich
                            if (tIdx % 2 === 0) {
                                await client.query(
                                    `INSERT INTO school.topic_resource (topic_id, type, title, resource_url, content_data)
                                     VALUES ($1, $2, $3, $4, $5)`,
                                    [
                                        topicId, 
                                        'DOCUMENT', 
                                        `Study Notes: ${topicTitle}`, 
                                        `https://blueprints.pynemonk.com/resources/${topicTitle.toLowerCase().replace(/ /g, '-')}-notes.pdf`,
                                        `## Study Material for ${topicTitle}\nDetailed explanation, equations, and exercises.`
                                    ]
                                );
                            }

                            // Seed a question for some topics to populate the question bank
                            if (tIdx % 2 === 1) {
                                await client.query(
                                    `INSERT INTO school.question_bank (topic_id, question_type, difficulty, taxonomy_level, question_text, options, answer_key, marks)
                                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                                    [
                                        topicId,
                                        'MCQ',
                                        'MEDIUM',
                                        'APPLICATION',
                                        `What is the primary application of ${topicTitle}?`,
                                        JSON.stringify({ A: "Theoretical calculation", B: "Practical problem solving", C: "Data compilation", D: "Historical reference" }),
                                        'B',
                                        2.0
                                    ]
                                );
                            }
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');
        console.log(`✅ Global Syllabus Library Seeding Completed Successfully!`);
        console.log(`📊 Stats:`);
        console.log(`   - Boards: ${BOARDS.length}`);
        console.log(`   - Grades: ${GRADES.length}`);
        console.log(`   - Subjects: ${SUBJECTS.length}`);
        console.log(`   - Syllabi Created: ${syllabusCount}`);
        console.log(`   - Chapters Created: ${chapterCount}`);
        console.log(`   - Topics Created: ${topicCount}`);

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ Seeding global syllabus library failed:', error);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}
seed();
