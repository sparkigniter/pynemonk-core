import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import fs from "fs";

const isDocker = fs.existsSync("/.dockerenv");
const dbHost = isDocker ? "postgres" : (process.env.PGHOST === "postgres" ? "localhost" : (process.env.PGHOST || "localhost"));

const pool = new Pool({
    user: process.env.PGUSER || "postgres",
    host: dbHost,
    database: process.env.PGDATABASE || "pynemonk_core",
    password: process.env.PGPASSWORD || "password",
    port: parseInt(process.env.PGPORT || "5432"),
});

// Arrays of realistic names and properties for generating random but realistic records
const FIRST_NAMES_MALE = ["Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Ishaan", "Aaryan", "Krishna", "Shaurya", "Kabir", "Rohan", "Dev", "Kabir", "Neil", "Yash", "Samar", "Arya"];
const FIRST_NAMES_FEMALE = ["Ananya", "Diya", "Pari", "Saanvi", "Angel", "Ishani", "Aanya", "Myra", "Kavya", "Riya", "Meera", "Zara", "Kiara", "Avani", "Sanya", "Nisha", "Ira"];
const LAST_NAMES = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Iyer", "Nair", "Joshi", "Choudhury", "Bose", "Menon", "Sen", "Rao", "Mehta", "Das"];
const GENDERS = ["male", "female"];
const RELIGIONS = ["Hindu", "Muslim", "Sikh", "Christian", "Jain"];
const BLOOD_GROUPS = ["A+", "O+", "B+", "AB+", "A-", "O-", "B-"];
const NATIONALITIES = ["Indian", "American", "British", "Canadian"];
const OCCUPATIONS = ["Software Engineer", "Doctor", "Business Owner", "Attorney", "Professor", "Architect", "Accountant", "Pilot", "Journalist", "Civil Servant"];

// Core Subjects mapping
const CORE_SUBJECTS = ["Mathematics", "Science", "English Literature", "Social Science", "Physics", "Chemistry", "Biology", "Computer Science", "Accountancy", "Business Studies", "Economics"];

// Standard role templateSync logic in Auth to make sure everything has correct state
async function ensureRoleTemplates(client: any) {
    // Ensure student:admin scope and permission records exist
    await client.query(`
        INSERT INTO auth.scope (value, description)
        VALUES ('student:admin', 'Administrative management of students and onboarding workflows')
        ON CONFLICT (value) DO NOTHING
    `);
    await client.query(`
        INSERT INTO auth.permission (key, description)
        VALUES ('student:admin', 'Administer students and onboarding pipelines')
        ON CONFLICT (key) DO NOTHING
    `);

    const templates = [
        { slug: "school_admin", name: "School Administrator", description: "School operations staff", tier: 2, is_system: true, data_scope: '["billing:read","billing:write","settings:read","settings:write","plan:change","user:invite","user:deactivate","student:read","student:admin","student:write","student.basic:read","student.contact:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","student.disciplinary:read","student.disciplinary:write","student.wellbeing:read","student.wellbeing:write","student.health:read","student.health:write","student.medical_history:read","student.medical_history:write","staff:read","staff:write","staff.academic:read","staff.leave:read","staff.leave:write","staff.payroll:read","staff.payroll:write","class:read","class:write","timetable:read","timetable:write","assignment:write","fee:read","fee:write","fee.collection:write","fee.summary:read","report:read","report:export","report.class:read","report.financial:read","report.financial:export","announcement:read","announcement:write","teacher.contact:read","parent:read","parent:write","library:read","library:write","visitor:write","self.academic:read","self.attendance:read","self.timetable:read","self.assignment:read","self.fee:read","child.academic:read","child.attendance:read","child.timetable:read","child.fee:read","child.disciplinary:read","coa:read","coa:write","journal:read","journal:write","invoice:read","invoice:write","payment:read","payment:write","accounting:read","assignment:read","exam:read","exam:write","mark:read","mark:write","teacher_note:read","teacher_note:write","system:manage","system:settings","fee:delete","assignment:delete","timetable:delete","report:write","staff.directory:read","student.directory:read"]' },
        { slug: "principal", name: "Principal", description: "Head of the school", tier: 2, is_system: true, data_scope: '["student:read","student.academic:read","student.attendance:read","staff:read","class:read","exam:read","report:read"]' },
        { slug: "teacher", name: "Teacher", description: "Subject teacher", tier: 3, is_system: true, data_scope: '["student:read","student:write","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","class:read","assignment:read","assignment:write","exam:read","exam:write","mark:read","mark:write","report.class:read","teacher_note:read","teacher_note:write","timetable:read","staff:read","staff.academic:read"]' },
        { slug: "accountant", name: "Accountant", description: "Manages financial operations", tier: 3, is_system: true, data_scope: '["coa:read","coa:write","journal:read","journal:write","invoice:read","invoice:write","payment:read","payment:write","accounting:read","accounting:write","fee:read","fee:write","fee.collection:write","fee.summary:read","student:read","report.financial:read","report.financial:export","staff.payroll:read","settings:read"]' },
        { slug: "parent", name: "Parent", description: "Parent / Guardian", tier: 4, is_system: true, data_scope: '["student:read","student.academic:read","student.attendance:read","timetable:read","announcement:read","report:read"]' },
        { slug: "student", name: "Student", description: "Enrolled student", tier: 5, is_system: true, data_scope: '["student.academic:read","student.attendance:read","timetable:read","announcement:read"]' }
    ];

    for (const t of templates) {
        await client.query(
            `INSERT INTO auth.role_template (slug, name, description, tier, is_system, data_scope)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb)
             ON CONFLICT (slug, COALESCE(client_id, 0)) DO UPDATE SET data_scope = EXCLUDED.data_scope`,
            [t.slug, t.name, t.description, t.tier, t.is_system, t.data_scope]
        );
    }
}

async function createUser(client: any, tenantId: number | null, email: string, roleId: number, firstName: string, lastName: string) {
    const passwordHash = "$2b$10$njZZti4N6qN3pm1jzTByS.IyjHg02ZUu2RvOtoqEb7fa2liw3z626"; // password123
    
    // 1. Insert User
    const userRes = await client.query(
        `INSERT INTO auth.user (tenant_id, email, role_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET role_id = EXCLUDED.role_id, tenant_id = EXCLUDED.tenant_id
         RETURNING id`,
        [tenantId, email, roleId]
    );
    const userId = userRes.rows[0].id;

    // 2. Insert Credentials
    await client.query(
        `INSERT INTO auth.user_credential (tenant_id, user_id, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [tenantId, userId, passwordHash]
    );

    // 3. User Primary Role Assignment
    await client.query(
        `INSERT INTO auth.user_role (user_id, role_id, is_primary)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = TRUE`,
        [userId, roleId]
    );

    // 4. Profile Data
    await client.query(
        `INSERT INTO auth.user_profile (tenant_id, user_id, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name`,
        [tenantId, userId, firstName, lastName]
    );

    return userId;
}

async function seed() {
    console.log("🌱 Starting platform-wide Consolidated Super-Seeding...");
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");

        // ==========================================
        // 1. DATABASE CLEANUP & TRUNCATION
        // ==========================================
        console.log("🧹 Cascading rollback-safe database truncation...");
        // Wipes out settings, users, and all child data in school & accounting schemas.
        // We preserve auth.tenant, auth.client, auth.scope, and auth.package to protect global configurations
        // that are wiped out by cascading table-level TRUNCATE commands.
        await client.query(`
            TRUNCATE 
                auth.user,
                auth.role,
                auth.tenant_setting,
                school.academic_year,
                school.grade,
                school.certificate_template,
                school.admission_config,
                school.global_board,
                school.global_grade,
                school.global_subject,
                school.global_syllabus,
                school.fee_discount,
                accounting.chart_of_accounts,
                accounting.fee_category,
                accounting.late_fee_policy,
                accounting.fiscal_year,
                accounting.partner,
                accounting.invoice,
                accounting.fee_invoice,
                accounting.fee_payment,
                accounting.fee_payment_allocation,
                accounting.vendor,
                accounting.vendor_bill,
                accounting.bill_payment,
                accounting.bill_payment_allocation,
                accounting.settings
            CASCADE;
        `);

        // ==========================================
        // 2. IDENTITY (AUTH) & TENANT REGISTRATION
        // ==========================================
        console.log("🏢 Registering default structures & premium tenant...");
        
        // Retrieve or insert Premium package
        let premiumPkgId;
        const pkgRes = await client.query("SELECT id FROM auth.package WHERE slug = 'premium' LIMIT 1");
        if (pkgRes.rows.length > 0) {
            premiumPkgId = pkgRes.rows[0].id;
        } else {
            const insPkgRes = await client.query(`
                INSERT INTO auth.package (name, slug, description, price_usd, features)
                VALUES ('Premium', 'premium', 'Ideal for mid-size institutions', 99.00, '["Up to 2000 students","25 staff accounts","All Standard features","Finance module","Parent portal"]')
                RETURNING id
            `);
            premiumPkgId = insPkgRes.rows[0].id;
        }

        // Create standard role templates
        await ensureRoleTemplates(client);

        // Instantiate Demo Academy Tenant
        const tenantRes = await client.query(
            `INSERT INTO auth.tenant (name, slug, email, package_id)
             VALUES ('Demo Academy', 'demo', 'admin@demo.edu', $1)
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, package_id = EXCLUDED.package_id
             RETURNING id`,
            [premiumPkgId]
        );
        const tenantId = tenantRes.rows[0].id;

        // Instantiate roles for the tenant from role templates
        await client.query(
            `INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, data_scope)
             SELECT $1, slug, name, description, tier, is_system, data_scope
             FROM auth.role_template`,
            [tenantId]
        );

        // Ensure Global System Admin Role exists
        await client.query(
            `INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, data_scope)
             VALUES (NULL, 'system_admin', 'System Administrator', 'Platform-wide administrator', 0, TRUE, '["system:manage","system:settings"]')
             ON CONFLICT (slug) WHERE tenant_id IS NULL AND is_deleted = FALSE DO NOTHING`
        );

        const rolesRes = await client.query("SELECT id, slug FROM auth.role WHERE tenant_id = $1 OR tenant_id IS NULL", [tenantId]);
        const roleMap = Object.fromEntries(rolesRes.rows.map(r => [r.slug, r.id]));

        // Create Global System Admin
        const sysAdminId = await createUser(client, null, "vikas@sparkigniter.com", roleMap["system_admin"], "Vikas", "System");
        console.log("👤 Created Global System Admin: vikas@sparkigniter.com");

        // Create School Administrator (Tenant Level)
        const adminUserId = await createUser(client, tenantId, "admin@demo.edu", roleMap["school_admin"], "Sanjay", "Gupta");
        await client.query(
            `INSERT INTO school.staff (tenant_id, user_id, employee_code, first_name, last_name, gender, designation, status)
             VALUES ($1, $2, 'ADM-001', 'Sanjay', 'Gupta', 'male', 'School Administrator', 'active')`,
            [tenantId, adminUserId]
        );
        console.log("👤 Created Tenant Administrator: admin@demo.edu");

        // Create Accountant
        const accountantUserId = await createUser(client, tenantId, "accountant@pynemonk.com", roleMap["accountant"], "John", "Doe");
        const accountantStaffRes = await client.query(
            `INSERT INTO school.staff (tenant_id, user_id, employee_code, first_name, last_name, gender, designation, status)
             VALUES ($1, $2, 'ACT-001', 'John', 'Doe', 'male', 'Chief Accountant', 'active')
             RETURNING id`,
            [tenantId, accountantUserId]
        );
        const accountantStaffId = accountantStaffRes.rows[0].id;
        console.log("👤 Created School Accountant: accountant@pynemonk.com");

        // Create Principal
        const principalUserId = await createUser(client, tenantId, "principal@demo.edu", roleMap["principal"], "Dr. Rajesh", "Khanna");
        await client.query(
            `INSERT INTO school.staff (tenant_id, user_id, employee_code, first_name, last_name, gender, designation, status)
             VALUES ($1, $2, 'PRN-001', 'Dr. Rajesh', 'Khanna', 'male', 'Principal', 'active')`,
            [tenantId, principalUserId]
        );
        console.log("👤 Created Principal: principal@demo.edu");

        // Setup Tenant Public Settings
        await client.query(
            `INSERT INTO auth.tenant_setting (tenant_id, key, value, is_public)
             VALUES 
                ($1, 'school_name', 'Demo Academy', TRUE),
                ($1, 'academic_year', '2026-2027', TRUE),
                ($1, 'currency', 'USD', TRUE),
                ($1, 'timezone', 'America/New_York', TRUE),
                ($1, 'address', '100 Education Way, Innovation District', TRUE)`,
            [tenantId]
        );

        // ==========================================
        // 3. ACADEMIC STRUCTURE (YEARS, GRADES, ROOMS)
        // ==========================================
        console.log("📅 Establishing Academic Years & Grades 1 to 12...");
        
        // Past Academic Year
        const ayPastRes = await client.query(
            `INSERT INTO school.academic_year (tenant_id, name, start_date, end_date, is_current)
             VALUES ($1, '2025-26', '2025-06-01', '2026-05-31', FALSE)
             RETURNING id`,
            [tenantId]
        );
        const ayPastId = ayPastRes.rows[0].id;

        // Current Academic Year
        const ayCurrentRes = await client.query(
            `INSERT INTO school.academic_year (tenant_id, name, start_date, end_date, is_current)
             VALUES ($1, '2026-27', '2026-06-01', '2027-05-31', TRUE)
             RETURNING id`,
            [tenantId]
        );
        const ayCurrentId = ayCurrentRes.rows[0].id;

        // Create Grades 1 to 12
        const gradeMap: { [name: string]: number } = {};
        for (let g = 1; g <= 12; g++) {
            const gName = `Grade ${g}`;
            const gRes = await client.query(
                `INSERT INTO school.grade (tenant_id, name, slug, sequence_order)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [tenantId, gName, `grade-${g}`, g]
            );
            gradeMap[gName] = gRes.rows[0].id;
        }

        // ==========================================
        // 4. CENTRAL SYLLABUS BLUEPRINTS (CBSE Library)
        // ==========================================
        console.log("🔌 Seeding Global Syllabus Blueprint Standards (CBSE)...");
        
        const boardRes = await client.query(
            `INSERT INTO school.global_board (name, description)
             VALUES ('CBSE', 'Central Board of Secondary Education, India')
             RETURNING id`
        );
        const boardId = boardRes.rows[0].id;

        const globalGrades: { [name: string]: number } = {};
        for (let g = 1; g <= 12; g++) {
            const gName = `Grade ${g}`;
            const ggRes = await client.query(
                `INSERT INTO school.global_grade (name, sequence_order)
                 VALUES ($1, $2)
                 RETURNING id`,
                [gName, g]
            );
            globalGrades[gName] = ggRes.rows[0].id;
        }

        const globalSubjects: { [name: string]: number } = {};
        for (const sub of CORE_SUBJECTS) {
            const gsRes = await client.query(
                `INSERT INTO school.global_subject (name)
                 VALUES ($1)
                 RETURNING id`,
                [sub]
            );
            globalSubjects[sub] = gsRes.rows[0].id;
        }

        // Seed comprehensive Global Syllabus, Chapters & Topics for demo classes (Grades 1, 5, 9, 11, 12)
        const demoGradeSubjectCombos = [
            { grade: "Grade 1", subject: "Mathematics", chapters: [
                { title: "Shapes and Space", desc: "Understanding spatial relationships and shapes.", recommended_periods: 10, topics: ["Inside and Outside", "Bigger and Smaller", "Shapes around us", "Rolling and Sliding"] },
                { title: "Numbers from One to Nine", desc: "Basic counting, place values, and comparisons.", recommended_periods: 15, topics: ["As many as", "Counting Numbers 1 to 9", "More or Less", "Making Groups"] }
            ]},
            { grade: "Grade 1", subject: "Science", chapters: [
                { title: "Living and Non-Living", desc: "Introduction to nature.", recommended_periods: 12, topics: ["Plants", "Animals", "Human Body"] }
            ]},
            { grade: "Grade 1", subject: "English Literature", chapters: [
                { title: "Alphabet Adventures", desc: "Learning vowels and consonants.", recommended_periods: 14, topics: ["Vowels", "Consonants", "Simple Words"] }
            ]},
            { grade: "Grade 1", subject: "Social Science", chapters: [
                { title: "My Family", desc: "Learning about social bonds.", recommended_periods: 10, topics: ["Parents", "Siblings", "Home"] }
            ]},

            { grade: "Grade 5", subject: "Science", chapters: [
                { title: "Super Senses", desc: "How animals sense the world.", recommended_periods: 12, topics: ["Sense of Smell in Ants", "Sense of Sight in Birds", "Sense of Hearing in Tigers", "Sleeping and Waking Cycles"] },
                { title: "From Tasting to Digesting", desc: "Human digestive system and food paths.", recommended_periods: 14, topics: ["Tastes and Tongue", "The Story of Digestion", "Healthy Food vs Junk Food", "Hunger and Energy"] }
            ]},
            { grade: "Grade 5", subject: "Mathematics", chapters: [
                { title: "Parts and Wholes", desc: "Fractions and Decimals.", recommended_periods: 15, topics: ["Fractions Introduction", "Decimals", "Percentages"] }
            ]},
            { grade: "Grade 5", subject: "English Literature", chapters: [
                { title: "Poems and Stories", desc: "Literary skills.", recommended_periods: 14, topics: ["Nature Poems", "Animal Fables"] }
            ]},
            { grade: "Grade 5", subject: "Social Science", chapters: [
                { title: "Globe and Maps", desc: "Geographical concepts.", recommended_periods: 12, topics: ["Continents", "Oceans", "Latitudes"] }
            ]},

            { grade: "Grade 9", subject: "Mathematics", chapters: [
                { title: "Number Systems", desc: "Irrational, rational, and real numbers.", recommended_periods: 12, topics: ["Rational Numbers Review", "Irrational Numbers on Number Line", "Real Numbers and Decimals", "Rationalizing the Denominator"] },
                { title: "Polynomials", desc: "Introduction to algebraic structures and zeros.", recommended_periods: 16, topics: ["Introduction to Polynomials", "Zeros of a Polynomial", "Remainder Theorem", "Factorization of Polynomials"] }
            ]},
            { grade: "Grade 9", subject: "Science", chapters: [
                { title: "Matter in Our Surroundings", desc: "Physical properties of matter.", recommended_periods: 14, topics: ["States of Matter", "Evaporation"] }
            ]},
            { grade: "Grade 9", subject: "English Literature", chapters: [
                { title: "The Fun They Had", desc: "Isaac Asimov future setting.", recommended_periods: 12, topics: ["Future Schools", "Margie and Tommy"] }
            ]},
            { grade: "Grade 9", subject: "Social Science", chapters: [
                { title: "French Revolution", desc: "Historical triggers of democracy.", recommended_periods: 15, topics: ["Causes", "Outbreak", "Legacy"] }
            ]},

            { grade: "Grade 11", subject: "Physics", chapters: [
                { title: "Physical World & Measurement", desc: "Units, dimensional analysis, and error propagation.", recommended_periods: 10, topics: ["SI Units and Standards", "Dimensional Formulae", "Accuracy and Precision", "Propagation of Errors"] },
                { title: "Kinematics", desc: "Motion in a straight line and vectors.", recommended_periods: 18, topics: ["Uniformly Accelerated Motion", "Vector Operations", "Projectile Motion", "Relative Velocity in 2D"] }
            ]},
            { grade: "Grade 11", subject: "Chemistry", chapters: [
                { title: "Some Basic Concepts of Chemistry", desc: "Mole Concept.", recommended_periods: 12, topics: ["Mole Concept", "Stoichiometry"] }
            ]},
            { grade: "Grade 11", subject: "Mathematics", chapters: [
                { title: "Sets and Functions", desc: "Venn Diagrams.", recommended_periods: 15, topics: ["Types of Sets", "Venn Diagrams"] }
            ]},
            { grade: "Grade 11", subject: "English Literature", chapters: [
                { title: "The Portrait of a Lady", desc: "Khushwant Singh biography.", recommended_periods: 12, topics: ["Grandmother Relation", "City School Life"] }
            ]},

            { grade: "Grade 12", subject: "Accountancy", chapters: [
                { title: "Accounting for Share Capital", desc: "Transactions related to issue of shares.", recommended_periods: 20, topics: ["Categories of Share Capital", "Issue of Shares at Par/Premium", "Forfeiture of Shares", "Re-issue of Forfeited Shares"] },
                { title: "Financial Statements of a Company", desc: "Format, schedules, and ratios.", recommended_periods: 15, topics: ["Schedule III Balance Sheet", "Statement of Profit and Loss", "Liquidity Ratios", "Solvency and Profitability Ratios"] }
            ]},
            { grade: "Grade 12", subject: "Business Studies", chapters: [
                { title: "Principles of Management", desc: "Fayol Principles.", recommended_periods: 15, topics: ["Fayol Principles", "Taylor Scientific Management"] }
            ]},
            { grade: "Grade 12", subject: "Economics", chapters: [
                { title: "National Income Accounting", desc: "GDP calculation.", recommended_periods: 15, topics: ["GDP", "NDP", "Circular Flow"] }
            ]},
            { grade: "Grade 12", subject: "English Literature", chapters: [
                { title: "The Last Lesson", desc: "Alphonse Daudet setting.", recommended_periods: 12, topics: ["French Language", "Prussian War Impact"] }
            ]}
        ];

        const syllabusSubIdMap: { [key: string]: number } = {};

        for (const combo of demoGradeSubjectCombos) {
            const bId = boardId;
            const ggId = globalGrades[combo.grade];
            const gsId = globalSubjects[combo.subject];
            
            const totalHours = combo.chapters.reduce((acc, c) => acc + c.recommended_periods, 0);

            // Insert Global Syllabus
            const gsylRes = await client.query(
                `INSERT INTO school.global_syllabus (board_id, grade_id, subject_id, academic_year, total_recommended_hours, is_published)
                 VALUES ($1, $2, $3, '2026-27', $4, TRUE)
                 RETURNING id`,
                [bId, ggId, gsId, totalHours]
            );
            const globalSyllabusId = gsylRes.rows[0].id;

            for (let cIdx = 0; cIdx < combo.chapters.length; cIdx++) {
                const ch = combo.chapters[cIdx];
                const gchRes = await client.query(
                    `INSERT INTO school.global_chapter (syllabus_id, title, description, sequence_order, recommended_periods)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                    [globalSyllabusId, ch.title, ch.desc, cIdx + 1, ch.recommended_periods]
                );
                const globalChapterId = gchRes.rows[0].id;

                for (let tIdx = 0; tIdx < ch.topics.length; tIdx++) {
                    const topTitle = ch.topics[tIdx];
                    const gtopRes = await client.query(
                        `INSERT INTO school.global_topic (chapter_id, title, description, learning_outcomes, sequence_order)
                         VALUES ($1, $2, $3, $4, $5)
                         RETURNING id`,
                        [globalChapterId, topTitle, `Detailed lessons on ${topTitle}`, `Master the concepts and practical applications of ${topTitle}`, tIdx + 1]
                    );
                    const globalTopicId = gtopRes.rows[0].id;

                    // Seed topic study resources
                    if (tIdx % 2 === 0) {
                        await client.query(
                            `INSERT INTO school.topic_resource (topic_id, type, title, resource_url, content_data)
                             VALUES ($1, 'DOCUMENT', $2, $3, $4)`,
                            [
                                globalTopicId,
                                `Study Material: ${topTitle}`,
                                `https://demo-resources.pynemonk.com/syllabus/${topTitle.toLowerCase().replace(/ /g, "-")}-notes.pdf`,
                                `## Chapter Resource: ${topTitle}\nComprehensive study notes, theorems, and sample problems.`
                            ]
                        );
                    }

                    // Seed topic practice question bank
                    await client.query(
                        `INSERT INTO school.question_bank (topic_id, question_type, difficulty, taxonomy_level, question_text, options, answer_key, marks)
                         VALUES ($1, 'MCQ', 'MEDIUM', 'APPLICATION', $2, $3, 'A', 2.00)`,
                        [
                            globalTopicId,
                            `Which of the following describes the key principle of ${topTitle}?`,
                            JSON.stringify({ A: "Correct Standard Option", B: "Distractor Option B", C: "Distractor Option C", D: "Distractor Option D" })
                        ]
                    );
                }
            }
            syllabusSubIdMap[`${combo.grade}-${combo.subject}`] = globalSyllabusId;
        }

        // ==========================================
        // 5. FACULTY & STAFF GENERATION (10+ Profiles)
        // ==========================================
        console.log("👩‍🏫 Generating lovely staff members and teacher assignments...");
        
        const teacherStaffIds: number[] = [];
        const teacherNames = [
            { first: "Sarah", last: "Jenkins", email: "teacher1@demo.edu", sub: "English Literature", qual: "MA in English Literature", des: "Senior English Lecturer" },
            { first: "Amit", last: "Patel", email: "teacher2@demo.edu", sub: "Mathematics", qual: "M.Sc in Applied Mathematics", des: "Maths HOD" },
            { first: "Priya", last: "Nair", email: "teacher3@demo.edu", sub: "Science", qual: "Ph.D in Biological Sciences", des: "Senior Science Advisor" },
            { first: "David", last: "Miller", email: "teacher4@demo.edu", sub: "Physics", qual: "M.Sc in Physics", des: "Physics Professor" },
            { first: "Kavita", last: "Sharma", email: "teacher5@demo.edu", sub: "Accountancy", qual: "MBA & Chartered Accountant", des: "Accountancy Specialist" },
            { first: "Robert", last: "Vance", email: "teacher6@demo.edu", sub: "Computer Science", qual: "M.Tech in CS", des: "Computer Science Instructor" },
            { first: "Elena", last: "Rostova", email: "teacher7@demo.edu", sub: "Social Science", qual: "MA in World History", des: "Humanities Faculty" }
        ];

        for (let i = 0; i < teacherNames.length; i++) {
            const t = teacherNames[i];
            const uId = await createUser(client, tenantId, t.email, roleMap["teacher"], t.first, t.last);
            const employeeCode = `TCH-${String(i + 1).padStart(3, "0")}`;
            const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${t.first}`;
            
            const staffRes = await client.query(
                `INSERT INTO school.staff (tenant_id, user_id, employee_code, first_name, last_name, gender, date_of_birth, phone, address, qualification, designation, status, avatar_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12)
                 RETURNING id`,
                [
                    tenantId, 
                    uId, 
                    employeeCode, 
                    t.first, 
                    t.last, 
                    i % 2 === 0 ? "female" : "male", 
                    "1985-05-12", 
                    `555-020${i}`, 
                    "123 Faculty Quarters, Demo Academy", 
                    t.qual, 
                    t.des,
                    avatarUrl
                ]
            );
            teacherStaffIds.push(staffRes.rows[0].id);
        }

        // ==========================================
        // 6. CLASSROOMS & TIMETABLE SETUP
        // ==========================================
        console.log("🏫 Formatting classrooms and period schedules...");
        
        // Define Period Configs (8 periods a day + Assembly + Lunch Break)
        const periodConfigs = [
            { name: "Morning Assembly", start: "08:15:00", end: "08:30:00", is_break: true },
            { name: "Period 1", start: "08:30:00", end: "09:15:00", is_break: false },
            { name: "Period 2", start: "09:15:00", end: "10:00:00", is_break: false },
            { name: "Short Recess", start: "10:00:00", end: "10:15:00", is_break: true },
            { name: "Period 3", start: "10:15:00", end: "11:00:00", is_break: false },
            { name: "Period 4", start: "11:00:00", end: "11:45:00", is_break: false },
            { name: "Lunch Break", start: "11:45:00", end: "12:30:00", is_break: true },
            { name: "Period 5", start: "12:30:00", end: "13:15:00", is_break: false },
            { name: "Period 6", start: "13:15:00", end: "14:00:00", is_break: false },
            { name: "Period 7", start: "14:00:00", end: "14:45:00", is_break: false },
            { name: "Period 8", start: "14:45:00", end: "15:30:00", is_break: false }
        ];

        for (const p of periodConfigs) {
            await client.query(
                `INSERT INTO school.period_config (tenant_id, name, start_time, end_time, is_break)
                 VALUES ($1, $2, $3, $4, $5)`,
                [tenantId, p.name, p.start, p.end, p.is_break]
            );
        }

        // Instantiating specific target classrooms for the current Academic Year
        const targetClassrooms = [
            { grade: "Grade 1", sec: "A", name: "Class 1-Alpha", room: "Room 101", teacherIdx: 1 },
            { grade: "Grade 5", sec: "A", name: "Class 5-Alpha", room: "Room 205", teacherIdx: 2 },
            { grade: "Grade 9", sec: "A", name: "Class 9-Alpha", room: "Room 309", teacherIdx: 1 },
            { grade: "Grade 11", sec: "A", name: "Class 11-Science-Alpha", room: "Room 411", teacherIdx: 3 },
            { grade: "Grade 12", sec: "B", name: "Class 12-Commerce-Beta", room: "Room 412", teacherIdx: 4 }
        ];

        const classroomMap: { [key: string]: number } = {};
        for (const c of targetClassrooms) {
            const gId = gradeMap[c.grade];
            const tStaffId = teacherStaffIds[c.teacherIdx];
            const classRes = await client.query(
                `INSERT INTO school.classroom (tenant_id, academic_year_id, grade_id, section, name, room, capacity, class_teacher_id)
                 VALUES ($1, $2, $3, $4, $5, $6, 35, $7)
                 RETURNING id`,
                [tenantId, ayCurrentId, gId, c.sec, c.name, c.room, tStaffId]
            );
            classroomMap[c.grade] = classRes.rows[0].id;
        }

        // Add core school subjects linked to Grades, assign teachers, and generate multi-slot Timetables
        const schoolSubjects: { [key: string]: number } = {};
        const daysOfWeek = [1, 2, 3, 4, 5]; // Monday to Friday

        const subjectsListForGrade: { [key: string]: string[] } = {
            "Grade 1": ["Mathematics", "Science", "English Literature", "Social Science"],
            "Grade 5": ["Mathematics", "Science", "English Literature", "Social Science"],
            "Grade 9": ["Mathematics", "Science", "English Literature", "Social Science"],
            "Grade 11": ["Physics", "Chemistry", "Mathematics", "English Literature"],
            "Grade 12": ["Accountancy", "Business Studies", "Economics", "English Literature"]
        };

        for (const c of targetClassrooms) {
            const gId = gradeMap[c.grade];
            const classId = classroomMap[c.grade];
            const subs = subjectsListForGrade[c.grade] || ["Mathematics"];
            
            for (let sIdx = 0; sIdx < subs.length; sIdx++) {
                const subName = subs[sIdx];
                
                // 1. Create school subject
                const subCode = `${subName.slice(0, 3).toUpperCase()}-${sIdx}-${gId}`;
                const subRes = await client.query(
                    `INSERT INTO school.subject (tenant_id, grade_id, name, code, description, periods_per_week)
                     VALUES ($1, $2, $3, $4, $5, 5)
                     RETURNING id`,
                    [tenantId, gId, subName, subCode, `Standard curriculum subject: ${subName}`]
                );
                const schoolSubId = subRes.rows[0].id;
                schoolSubjects[`${c.grade}-${subName}`] = schoolSubId;

                // 2. Teacher subject classroom assignment (assign English Literature explicitly to Sarah Jenkins [index 0] so she teaches multiple classes!)
                const assignedTeacherStaffId = subName === "English Literature"
                    ? teacherStaffIds[0]
                    : teacherStaffIds[(c.teacherIdx + sIdx) % teacherStaffIds.length];
                await client.query(
                    `INSERT INTO school.teacher_assignment (tenant_id, staff_id, classroom_id, subject_id, academic_year_id)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [tenantId, assignedTeacherStaffId, classId, schoolSubId, ayCurrentId]
                );

                // 3. Timetable slots
                for (const day of daysOfWeek) {
                    const startH = 8 + sIdx;
                    const startStr = `${String(startH).padStart(2, "0")}:30:00`;
                    await client.query(
                        `INSERT INTO school.timetable (tenant_id, classroom_id, subject_id, teacher_id, academic_year_id, day_of_week, start_time, end_time)
                         VALUES 
                            ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [tenantId, classId, schoolSubId, assignedTeacherStaffId, ayCurrentId, day, startStr, `${String(startH + 1).padStart(2, "0")}:15:00`]
                    );
                }

                // 4. Auto Academic Plan & Smart Syllabus Subscription linking
                const globalSyllabusId = syllabusSubIdMap[`${c.grade}-${subName}`];
                if (globalSyllabusId) {
                    const subscRes = await client.query(
                        `INSERT INTO school.school_syllabus_subscription (tenant_id, academic_year_id, school_subject_id, global_syllabus_id)
                         VALUES ($1, $2, $3, $4)
                         RETURNING id`,
                        [tenantId, ayCurrentId, schoolSubId, globalSyllabusId]
                    );
                    const subscId = subscRes.rows[0].id;

                    const planRes = await client.query(
                        `INSERT INTO school.auto_academic_plan (tenant_id, school_syllabus_id, classroom_id, teacher_id, is_generated)
                         VALUES ($1, $2, $3, $4, TRUE)
                         RETURNING id`,
                        [tenantId, subscId, classId, assignedTeacherStaffId]
                    );
                    const planId = planRes.rows[0].id;

                    // Create planned sessions in the past (completed) and future (planned/delayed)
                    const topicsRes = await client.query(
                        `SELECT gt.id, gt.title FROM school.global_topic gt
                         JOIN school.global_chapter gc ON gt.chapter_id = gc.id
                         WHERE gc.syllabus_id = $1
                         ORDER BY gc.sequence_order, gt.sequence_order`,
                        [globalSyllabusId]
                    );

                    for (let tIdx = 0; tIdx < topicsRes.rows.length; tIdx++) {
                        const top = topicsRes.rows[tIdx];
                        const sessionDate = new Date();
                        sessionDate.setDate(sessionDate.getDate() + (tIdx - 2)); // 2 in the past, rest in future
                        const formattedDate = sessionDate.toISOString().slice(0, 10);
                        
                        const status = tIdx < 2 ? "COMPLETED" : (tIdx === 2 ? "DELAYED" : "PLANNED");
                        const completedAt = tIdx < 2 ? "NOW()" : null;
                        const teacherNotes = tIdx < 2 ? `Delivered successfully. Students were receptive.` : `Scheduled slot.`;

                        await client.query(
                            `INSERT INTO school.planned_session (tenant_id, plan_id, global_topic_id, scheduled_date, status, teacher_notes, completed_at)
                             VALUES ($1, $2, $3, $4, $5, $6, ${completedAt ? "NOW()" : "NULL"})`,
                            [tenantId, planId, top.id, formattedDate, status, teacherNotes]
                        );
                    }
                }
            }
        }

        // ==========================================
        // 7. STUDENT & GUARDIAN REGISTRY (40+ Records)
        // ==========================================
        console.log("👶 Enrolling 45+ Students and Guardians with full dossiers...");
        
        // Single parent record to bulk-assign to some students
        const parentUserId = await createUser(client, tenantId, "parent1@demo.edu", roleMap["parent"], "Ramesh", "Sharma");
        const guardianRes = await client.query(
            `INSERT INTO school.guardian (tenant_id, user_id, first_name, last_name, gender, phone, email, address, occupation)
             VALUES ($1, $2, 'Ramesh', 'Sharma', 'male', '987-654-3210', 'parent1@demo.edu', '456 Residency Ave, Tech Park', 'Business Owner')
             RETURNING id`,
            [tenantId, parentUserId]
        );
        const demoGuardianId = guardianRes.rows[0].id;

        const studentEnrollments: { studentId: number; classId: number; name: string }[] = [];

        // Generate 45 Students distributed across classrooms (Grade 1, 5, 9, 11, 12)
        const classroomsList = Object.entries(classroomMap); // [ ["Grade 1", classId], ... ]
        
        for (let i = 1; i <= 45; i++) {
            const isMale = i % 2 === 0;
            const fName = isMale ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
            const lName = LAST_NAMES[i % LAST_NAMES.length];
            const studentEmail = `student${i}@demo.edu`;
            const admissionNo = `ADM-2026-${String(1000 + i)}`;
            const rollNo = `R-26-${String(i).padStart(3, "0")}`;

            // Create login credentials for student
            const sUserId = await createUser(client, tenantId, studentEmail, roleMap["student"], fName, lName);

            // Insert school.student
            const gender = isMale ? "male" : "female";
            const religion = RELIGIONS[i % RELIGIONS.length];
            const blood = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
            const nat = NATIONALITIES[i % NATIONALITIES.length];
            const dob = `201${12 - (i % 6)}-03-14`;

            const sRes = await client.query(
                `INSERT INTO school.student (tenant_id, user_id, admission_no, first_name, last_name, gender, date_of_birth, phone, address, blood_group, religion, nationality)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING id`,
                [tenantId, sUserId, admissionNo, fName, lName, gender, dob, `555-08${i}`, `Residential Area block ${i}, City`, blood, religion, nat]
            );
            const studentId = sRes.rows[0].id;

            // Link to parent
            if (i === 1 || i === 2 || i === 5) {
                // Link to standard demo guardian (Ramesh Sharma, exactly 3 siblings in Grade 5, Grade 9, and Grade 1)
                await client.query(
                    `INSERT INTO school.student_guardian (tenant_id, student_id, guardian_id, relation, is_emergency)
                     VALUES ($1, $2, $3, 'Father', TRUE)`,
                    [tenantId, studentId, demoGuardianId]
                );
            } else {
                // Create unique guardian
                const guardEmail = `parent_${i}@demo.edu`;
                const guardUser = await createUser(client, tenantId, guardEmail, roleMap["parent"], `Guard-${fName}`, lName);
                const occ = OCCUPATIONS[i % OCCUPATIONS.length];
                
                const uniqGuardRes = await client.query(
                    `INSERT INTO school.guardian (tenant_id, user_id, first_name, last_name, gender, phone, email, address, occupation)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING id`,
                    [tenantId, guardUser, `Guard-${fName}`, lName, isMale ? "male" : "female", `555-09${i}`, guardEmail, `Residency Row ${i}, Heights`, occ]
                );
                const uniqGuardId = uniqGuardRes.rows[0].id;

                await client.query(
                    `INSERT INTO school.student_guardian (tenant_id, student_id, guardian_id, relation, is_emergency)
                     VALUES ($1, $2, $3, $4, TRUE)`,
                    [tenantId, studentId, uniqGuardId, i % 2 === 0 ? "Mother" : "Father"]
                );
            }

            // Enroll Student into a Classroom (distribution)
            const [gradeName, classId] = classroomsList[i % classroomsList.length];
            const enrollRes = await client.query(
                `INSERT INTO school.student_enrollment (tenant_id, student_id, classroom_id, academic_year_id, roll_number, status)
                 VALUES ($1, $2, $3, $4, $5, 'active')
                 RETURNING id`,
                [tenantId, studentId, classId, ayCurrentId, rollNo]
            );
            const enrollmentId = enrollRes.rows[0].id;

            studentEnrollments.push({ studentId, classId, name: `${fName} ${lName}` });

            // Create ledger Contact / Partner profile for this student
            await client.query(
                `INSERT INTO accounting.partner (tenant_id, name, email, phone, type, external_ref_type, external_ref_id, is_active)
                 VALUES ($1, $2, $3, $4, 'student', 'student', $5, TRUE)
                 ON CONFLICT (tenant_id, external_ref_type, external_ref_id) DO NOTHING`,
                [tenantId, `${fName} ${lName}`, studentEmail, `555-08${i}`, studentId]
            );

            // ==========================================
            // 8. 14-DAY ATTENDANCE LOG GENERATION
            // ==========================================
            // Seeds back-dated attendance to make tracking trends look real
            for (let d = 0; d < 14; d++) {
                const date = new Date();
                date.setDate(date.getDate() - d);
                // Skip weekends
                if (date.getDay() === 0 || date.getDay() === 6) continue;

                const formattedDate = date.toISOString().slice(0, 10);
                
                // Attendance: 94% present, 4% late, 2% absent
                const rand = Math.random();
                let status = "present";
                let remarks = "On Time";
                if (rand > 0.94 && rand <= 0.98) {
                    status = "late";
                    remarks = "Late by 10 minutes (Bus delay)";
                } else if (rand > 0.98) {
                    status = "absent";
                    remarks = "Medical Leave / Sick";
                }

                await client.query(
                    `INSERT INTO school.attendance (tenant_id, enrollment_id, date, status, remarks, marked_by)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (enrollment_id, date) DO NOTHING`,
                    [tenantId, enrollmentId, formattedDate, status, remarks, teacherStaffIds[i % teacherStaffIds.length]]
                );
            }
        }
        console.log(`✅ Admitted & Enrolled 45 Students across Classrooms.`);

        // ==========================================
        // 9. EXAMS & DETAILED ASSESSMENT MARKS
        // ==========================================
        console.log("📝 Generating Exam Terms and Marks transcripts...");
        
        const examRes = await client.query(
            `INSERT INTO school.exam (tenant_id, academic_year_id, name, description, exam_type, start_date, end_date, status, results_published)
             VALUES ($1, $2, 'Mid-Term Examination 2026', 'First Term Comprehensive Assessments', 'periodic', CURRENT_DATE - 5, CURRENT_DATE + 5, 'published', TRUE)
             RETURNING id`,
            [tenantId, ayCurrentId]
        );
        const examId = examRes.rows[0].id;

        // Create exam papers for our major subjects and link marks
        for (const [gradeSubjectKey, schoolSubId] of Object.entries(schoolSubjects)) {
            const [gradeName, subName] = gradeSubjectKey.split("-");
            const classId = classroomMap[gradeName];

            // 1. Exam Invitation
            await client.query(
                `INSERT INTO school.exam_invitation (tenant_id, exam_id, grade_id, classroom_id)
                 VALUES ($1, $2, $3, $4)`,
                [tenantId, examId, gradeMap[gradeName], classId]
            );

            // 2. Exam Paper
            const paperRes = await client.query(
                `INSERT INTO school.exam_paper (tenant_id, exam_id, subject_id, exam_date, start_time, end_time, max_marks, passing_marks, supervisor_id)
                 VALUES ($1, $2, $3, CURRENT_DATE - 2, '09:00:00', '12:00:00', 100.00, 35.00, $4)
                 RETURNING id`,
                [tenantId, examId, schoolSubId, teacherStaffIds[0]]
            );
            const paperId = paperRes.rows[0].id;

            // 3. Exam marks for enrolled students in this classroom
            const classroomStudents = studentEnrollments.filter(se => se.classId === classId);
            for (const stud of classroomStudents) {
                // Organic grades: most get 65-95, some fail (under 35), some excel (98+)
                const randMark = Math.random();
                let score = 75;
                let isAbsent = false;
                let remarks = "Excellent grasp.";

                if (randMark > 0.95) {
                    score = 98;
                    remarks = "Outstanding performance, top score.";
                } else if (randMark > 0.85 && randMark <= 0.95) {
                    score = 45;
                    remarks = "Needs revision in fundamentals.";
                } else if (randMark > 0.80 && randMark <= 0.85) {
                    score = 28;
                    remarks = "Failed. Requires remedial assistance.";
                } else if (randMark <= 0.02) {
                    score = 0;
                    isAbsent = true;
                    remarks = "Absent with medical certificate.";
                } else {
                    score = Math.floor(Math.random() * 20) + 65; // 65-85
                }

                await client.query(
                    `INSERT INTO school.exam_marks (tenant_id, exam_id, paper_id, student_id, marks_obtained, is_absent, remarks, created_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (paper_id, student_id) DO NOTHING`,
                    [tenantId, examId, paperId, stud.studentId, isAbsent ? null : score, isAbsent, remarks, teacherStaffIds[0]]
                );
            }
        }
        console.log("✅ Seeded Exam structures & Grades sheets.");

        // ==========================================
        // 10. LEAVE MANAGEMENT & PAYROLL FLOW
        // ==========================================
        console.log("✈️ Seeding Faculty Leave Applications & Monthly Payslips...");
        
        // Leaves Setup
        const casualLeaveType = (await client.query(`INSERT INTO school.leave_type (tenant_id, name, default_days) VALUES ($1, 'Casual Leave', 12) RETURNING id`, [tenantId])).rows[0].id;
        const sickLeaveType = (await client.query(`INSERT INTO school.leave_type (tenant_id, name, default_days) VALUES ($1, 'Sick Leave', 10) RETURNING id`, [tenantId])).rows[0].id;

        // Staff Leave request applications
        await client.query(
            `INSERT INTO school.leave_application (tenant_id, staff_id, leave_type_id, start_date, end_date, reason, status, approved_by)
             VALUES 
                ($1, $2, $3, CURRENT_DATE - 5, CURRENT_DATE - 4, 'High fever and doctors visit', 'Approved', $4),
                ($1, $4, $5, CURRENT_DATE + 5, CURRENT_DATE + 7, 'Family gathering trip', 'Pending', NULL)`,
            [tenantId, teacherStaffIds[0], sickLeaveType, teacherStaffIds[1], casualLeaveType]
        );

        // Salary structure definitions
        for (const tStaffId of teacherStaffIds) {
            await client.query(
                `INSERT INTO school.salary_structure (tenant_id, staff_id, base_salary, allowances, deductions)
                 VALUES ($1, $2, 4500.00, '[{"name": "HRA", "amount": 1500.00}, {"name": "Allowance", "amount": 500.00}]'::jsonb, '[{"name": "Deductions", "amount": 200.00}]'::jsonb)
                 ON CONFLICT (staff_id, tenant_id) DO NOTHING`,
                [tenantId, tStaffId]
            );
        }

        // Payslips for past 3 months
        const months = [
            { name: "March 2026", month: 3, year: 2026 },
            { name: "April 2026", month: 4, year: 2026 },
            { name: "May 2026", month: 5, year: 2026 }
        ];

        for (const m of months) {
            for (let sIdx = 0; sIdx < teacherStaffIds.length; sIdx++) {
                const tStaffId = teacherStaffIds[sIdx];
                await client.query(
                    `INSERT INTO school.payslip (tenant_id, staff_id, month, year, base_salary, total_allowances, total_deductions, net_salary, status, paid_at)
                     VALUES ($1, $2, $3, $4, 4500.00, 2000.00, 200.00, 6300.00, 'paid', CURRENT_TIMESTAMP)`,
                    [tenantId, tStaffId, m.month, m.year]
                );
            }
        }
        console.log("✅ Seeded Faculty Payroll & Leaves logs.");

        // ==========================================
        // 11. LMS LITE & HOMEWORK PORTAL
        // ==========================================
        console.log("💻 Seeding LMS resources, Assignments & student submissions...");
        
        // 1. Syllabus planned resource library
        const lmsRes = await client.query(
            `INSERT INTO school.lms_resource (tenant_id, classroom_id, subject_id, created_by, title, description, url, resource_type, is_public)
             VALUES ($1, $2, $3, $4, 'Core Physics Study Notes', 'Chapter 1 & 2 formula sheets and references.', 'https://demo.edu/phys_formula.pdf', 'pdf', TRUE)
             RETURNING id`,
            [tenantId, classroomMap["Grade 11"], schoolSubjects["Grade 11-Physics"], teacherStaffIds[3]]
        );
        const lmsResourceId = lmsRes.rows[0].id;

        // 2. Homework Tasks
        const hwRes = await client.query(
            `INSERT INTO school.homework (tenant_id, classroom_id, subject_id, staff_id, title, description, due_date, assignment_type, submission_type, allow_late, is_graded)
             VALUES ($1, $2, $3, $4, 'Algebra Worksheet: Factoring Trinomials', 'Solve all 15 questions from the attached booklet. Upload PDFs.', CURRENT_DATE + 3, 'homework', 'both', FALSE, TRUE)
             RETURNING id`,
            [tenantId, classroomMap["Grade 9"], schoolSubjects["Grade 9-Mathematics"], teacherStaffIds[1]]
        );
        const homeworkId = hwRes.rows[0].id;

        // 3. Student homework submissions
        const class9Students = studentEnrollments.filter(se => se.classId === classroomMap["Grade 9"]);
        for (let sIdx = 0; sIdx < Math.min(classroomMap["Grade 9"], 5); sIdx++) {
            const stud = class9Students[sIdx];
            if (!stud) continue;
            
            await client.query(
                `INSERT INTO school.lms_submission (tenant_id, homework_id, student_id, submission_text, file_urls, status, marks_obtained, teacher_feedback, graded_by)
                 VALUES ($1, $2, $3, 'Submitted early, attached is my complete sheet of calculations.', ARRAY['https://school-cloud.com/calc1.pdf'], 'graded', 90.00, 'Excellent clean workings!', $4)`,
                [tenantId, homeworkId, stud.studentId, teacherStaffIds[1]]
            );
        }

        // ==========================================
        // 12. COMMUNICATIONS (TICKETS & POSTS)
        // ==========================================
        console.log("📢 Seeding Support tickets and Institutional bulletins...");
        
        // 1. Announcements
        await client.query(
            `INSERT INTO school.announcement (tenant_id, title, content, published_by)
             VALUES 
                ($1, 'Annual Sports Meet 2026', 'Registrations are open for track and field events from next Monday.', $2),
                ($1, 'Parent Teacher Summit Scheduled', 'Meeting will take place in the main auditorium to discuss term reports.', $2)`,
            [tenantId, teacherStaffIds[0]]
        );

        // 2. Communication Tickets (Support requests from parents)
        const ticketRes = await client.query(
            `INSERT INTO school.communication_ticket (tenant_id, student_id, teacher_id, guardian_id, title, type, status, category)
             VALUES ($1, $2, $3, $4, 'Inquiry regarding Term 1 Transport fee balance', 'query', 'open', 'general')
             RETURNING id`,
            [tenantId, studentEnrollments[0].studentId, teacherStaffIds[0], demoGuardianId]
        );
        const ticketId = ticketRes.rows[0].id;

        // Messages inside the thread
        await client.query(
            `INSERT INTO school.communication_message (tenant_id, ticket_id, sender_id, message)
             VALUES 
                ($1, $2, $3, 'Hello Admin, my bank statement shows the Term 1 transport fee of $200 has been debited, but the dashboard still displays it as unpaid. Please assist.'),
                ($1, $2, $4, 'Hello, thank you for writing. We are verifying the bank deposit reference. We will get back to you shortly.')`,
            [tenantId, ticketId, parentUserId, adminUserId]
        );

        // ==========================================
        // 13. FINANCE: LEDGER & BOOKKEEPING (COA)
        // ==========================================
        console.log("💰 Formatting ledger accounts, mappings, and balance openings...");
        
        // Fetch account types
        const typeAsset = (await client.query("SELECT id FROM accounting.account_type WHERE name = 'Asset' LIMIT 1")).rows[0].id;
        const typeLiab = (await client.query("SELECT id FROM accounting.account_type WHERE name = 'Liability' LIMIT 1")).rows[0].id;
        const typeEq = (await client.query("SELECT id FROM accounting.account_type WHERE name = 'Equity' LIMIT 1")).rows[0].id;
        const typeRev = (await client.query("SELECT id FROM accounting.account_type WHERE name = 'Revenue' LIMIT 1")).rows[0].id;
        const typeExp = (await client.query("SELECT id FROM accounting.account_type WHERE name = 'Expense' LIMIT 1")).rows[0].id;

        // Main Ledger Groups
        const assetsGrp = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group) VALUES ($1, '100000', 'Current Assets', $2, TRUE) RETURNING id`, [tenantId, typeAsset])).rows[0].id;
        const bankGrp = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '110000', 'Cash & Bank Accounts', $2, $3, TRUE) RETURNING id`, [tenantId, typeAsset, assetsGrp])).rows[0].id;
        const liabGrp = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group) VALUES ($1, '200000', 'Current Liabilities', $2, TRUE) RETURNING id`, [tenantId, typeLiab])).rows[0].id;
        const eqGrp = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group) VALUES ($1, '300000', 'Capital & Equity', $2, TRUE) RETURNING id`, [tenantId, typeEq])).rows[0].id;
        const revGrp = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group) VALUES ($1, '400000', 'School Revenue', $2, TRUE) RETURNING id`, [tenantId, typeRev])).rows[0].id;
        const expGrp = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, is_group) VALUES ($1, '500000', 'Operational Expenses', $2, TRUE) RETURNING id`, [tenantId, typeExp])).rows[0].id;

        // Individual Accounts
        const mainBankCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '111000', 'Main Operating Bank', $2, $3, FALSE) RETURNING id`, [tenantId, typeAsset, bankGrp])).rows[0].id;
        const arCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '120000', 'Accounts Receivable (Fees)', $2, $3, FALSE) RETURNING id`, [tenantId, typeAsset, assetsGrp])).rows[0].id;
        const cashCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '112000', 'Petty Cash Ledger', $2, $3, FALSE) RETURNING id`, [tenantId, typeAsset, bankGrp])).rows[0].id;

        const apCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '210000', 'Accounts Payable (Vendors)', $2, $3, FALSE) RETURNING id`, [tenantId, typeLiab, liabGrp])).rows[0].id;
        const salaryPayableCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '220000', 'Salaries Payable', $2, $3, FALSE) RETURNING id`, [tenantId, typeLiab, liabGrp])).rows[0].id;

        const retainedCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '310000', 'Retained Earnings', $2, $3, FALSE) RETURNING id`, [tenantId, typeEq, eqGrp])).rows[0].id;

        const tuitionRevCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '410000', 'Tuition Fees Revenue', $2, $3, FALSE) RETURNING id`, [tenantId, typeRev, revGrp])).rows[0].id;
        const admissionRevCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '420000', 'Admission Registration Fees', $2, $3, FALSE) RETURNING id`, [tenantId, typeRev, revGrp])).rows[0].id;
        const genRevCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '430000', 'General Sundry Income', $2, $3, FALSE) RETURNING id`, [tenantId, typeRev, revGrp])).rows[0].id;

        const salaryExpCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '510000', 'Teacher Salaries Expense', $2, $3, FALSE) RETURNING id`, [tenantId, typeExp, expGrp])).rows[0].id;
        const rentExpCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '520000', 'Rent & Infrastructure Utility', $2, $3, FALSE) RETURNING id`, [tenantId, typeExp, expGrp])).rows[0].id;
        const booksExpCoa = (await client.query(`INSERT INTO accounting.chart_of_accounts (tenant_id, code, name, account_type_id, parent_id, is_group) VALUES ($1, '530000', 'Books & Printing Expense', $2, $3, FALSE) RETURNING id`, [tenantId, typeExp, expGrp])).rows[0].id;

        // Register Core Mappings
        await client.query(
            `INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id)
             VALUES 
                ($1, 'ASSET_BANK', $2),
                ($1, 'ASSET_RECEIVABLE', $3),
                ($1, 'ASSET_CASH', $4),
                ($1, 'REV_TUITION', $5),
                ($1, 'REV_ADMISSION', $6),
                ($1, 'REV_GENERAL', $7),
                ($1, 'EXP_SALARY', $8),
                ($1, 'LIAB_PAYABLE', $9),
                ($1, 'LIAB_SALARY_PAYABLE', $10),
                ($1, 'EQUITY_RETAINED_EARNINGS', $11)
             ON CONFLICT (tenant_id, mapping_key) DO UPDATE SET account_id = EXCLUDED.account_id`,
            [tenantId, mainBankCoa, arCoa, cashCoa, tuitionRevCoa, admissionRevCoa, genRevCoa, salaryExpCoa, apCoa, salaryPayableCoa, retainedCoa]
        );

        // Bank Accounts opening
        const bankAccountRes = await client.query(
            `INSERT INTO accounting.bank_account (tenant_id, name, bank_name, account_no, gl_account_id, opening_balance)
             VALUES ($1, 'Chase Commercial Account', 'JP Morgan Chase Bank', '1100223344', $2, 450000.00)
             RETURNING id`,
            [tenantId, mainBankCoa]
        );
        const bankAccountId = bankAccountRes.rows[0].id;

        // Setup double entry opening balance ledger entry
        const entryOpeningRes = await client.query(
            `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, status)
             VALUES ($1, '2026-01-01', 'JE-OPENING-2026', 'Opening balances migration', 'posted')
             RETURNING id`,
            [tenantId]
        );
        const openingJeId = entryOpeningRes.rows[0].id;
        
        await client.query(
            `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit)
             VALUES 
                ($1, $2, $3, 450000.00, 0.00),
                ($1, $2, $4, 0.00, 450000.00)`,
            [tenantId, openingJeId, mainBankCoa, retainedCoa]
        );

        // ==========================================
        // 14. FEE STRUCTURES & STUDENT BILLING
        // ==========================================
        console.log("💰 Formatting student billing groups, allocations, and invoices...");
        
        // Fee heads
        const feeHeadRes = await client.query(
            `INSERT INTO school.fee_head (tenant_id, name, ledger_account_id)
             VALUES ($1, 'Tuition Fee Standard', $2)
             RETURNING id`,
            [tenantId, tuitionRevCoa]
        );
        const tuitionFeeHeadId = feeHeadRes.rows[0].id;

        const labFeeHeadRes = await client.query(
            `INSERT INTO school.fee_head (tenant_id, name, ledger_account_id)
             VALUES ($1, 'Advanced Science Lab Fee', $2)
             RETURNING id`,
            [tenantId, genRevCoa]
        );
        const labFeeHeadId = labFeeHeadRes.rows[0].id;

        // Standard K-12 Fee structures
        const strucRes = await client.query(
            `INSERT INTO school.fee_structure (tenant_id, academic_year_id, name)
             VALUES ($1, $2, 'Standard Annual Plan')
             RETURNING id`,
            [tenantId, ayCurrentId]
        );
        const structureId = strucRes.rows[0].id;

        // Create matching accounting fee category & structure to satisfy FK constraints on accounting.fee_payment
        const acctCategoryRes = await client.query(
            `INSERT INTO accounting.fee_category (tenant_id, name)
             VALUES ($1, 'Standard Annual Plan')
             RETURNING id`,
            [tenantId]
        );
        const acctCategoryId = acctCategoryRes.rows[0].id;

        const acctStructureId = structureId;

        // Installment items (Term 1 & Term 2 installments)
        const item1Res = await client.query(
            `INSERT INTO school.fee_structure_item (fee_structure_id, fee_head_id, amount, installment_name)
             VALUES ($1, $2, 6000.00, 'Term 1 Installment')
             RETURNING id`,
            [structureId, tuitionFeeHeadId]
        );
        const item1Id = item1Res.rows[0].id;

        const item2Res = await client.query(
            `INSERT INTO school.fee_structure_item (fee_structure_id, fee_head_id, amount, installment_name)
             VALUES ($1, $2, 4000.00, 'Term 2 Installment')
             RETURNING id`,
            [structureId, tuitionFeeHeadId]
        );
        const item2Id = item2Res.rows[0].id;

        // Setup legacy fee installments for compliance
        const legInst1 = await client.query(
            `INSERT INTO accounting.fee_installment (tenant_id, academic_year_id, name, due_date, late_fee_amount, sort_order)
             VALUES ($1, $2, 'Term 1 Installment', CURRENT_DATE - 15, 50.00, 1) RETURNING id`,
            [tenantId, ayCurrentId]
        );
        const legacyInst1Id = legInst1.rows[0].id;

        const legInst2 = await client.query(
            `INSERT INTO accounting.fee_installment (tenant_id, academic_year_id, name, due_date, late_fee_amount, sort_order)
             VALUES ($1, $2, 'Term 2 Installment', CURRENT_DATE + 30, 50.00, 2) RETURNING id`,
            [tenantId, ayCurrentId]
        );
        const legacyInst2Id = legInst2.rows[0].id;

        // Loop through all 45 enrolled students to allocate fee structures and generate invoice allocations
        // Mapped ratios: 40% fully paid, 30% partially paid, 30% unpaid
        for (let i = 0; i < studentEnrollments.length; i++) {
            const stud = studentEnrollments[i];
            const partnerId = (await client.query("SELECT id FROM accounting.partner WHERE tenant_id = $1 AND external_ref_type = 'student' AND external_ref_id = $2 LIMIT 1", [tenantId, stud.studentId])).rows[0].id;

            // 1. Allocate fee structure to student
            const sfaRes = await client.query(
                `INSERT INTO school.student_fee_allocation (tenant_id, student_id, fee_structure_id, academic_year_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [tenantId, stud.studentId, structureId, ayCurrentId]
            );
            const allocationId = sfaRes.rows[0].id;

            // Ratios
            let invoiceStatus = "unpaid";
            let paidAmount = 0.00;
            let totalBill = 10000.00; // sum of term 1 (6000) & term 2 (4000)
            
            if (i % 10 < 4) {
                invoiceStatus = "paid";
                paidAmount = totalBill;
            } else if (i % 10 >= 4 && i % 10 < 7) {
                invoiceStatus = "partial";
                paidAmount = 6000.00; // term 1 paid, term 2 remaining
            }

            const dueAmount = totalBill - paidAmount;

            // Create core invoice
            const invoiceNo = `INV-26-${2000 + i}`;
            const invRes = await client.query(
                `INSERT INTO accounting.invoice (tenant_id, partner_id, invoice_no, invoice_date, due_date, total_amount, net_amount, paid_amount, due_amount, status, source_type, source_id)
                 VALUES ($1, $2, $3, CURRENT_DATE - 20, CURRENT_DATE + 30, $4, $4, $5, $6, $7, 'fee_group', $8)
                 RETURNING id`,
                [tenantId, partnerId, invoiceNo, totalBill, paidAmount, dueAmount, invoiceStatus, allocationId]
            );
            const invoiceId = invRes.rows[0].id;

            // Invoice lines
            await client.query(
                `INSERT INTO accounting.invoice_line (tenant_id, invoice_id, description, quantity, unit_price, amount, ledger_account_id)
                 VALUES 
                    ($1, $2, 'Term 1 Installment: Tuition Fee', 1.0, 6000.00, 6000.00, $3),
                    ($1, $2, 'Term 2 Installment: Tuition Fee', 1.0, 4000.00, 4000.00, $3)`,
                [tenantId, invoiceId, tuitionRevCoa]
            );

            // Installment school tables link (complies with school models)
            const schoolInst1 = await client.query(
                `INSERT INTO school.fee_installment (allocation_id, fee_structure_item_id, invoice_id, amount_due, amount_paid, status, due_date)
                 VALUES ($1, $2, $3, 6000.00, $4, $5, CURRENT_DATE - 15) RETURNING id`,
                [
                    allocationId,
                    item1Id,
                    invoiceId,
                    (invoiceStatus === "paid" || invoiceStatus === "partial") ? 6000.00 : 0.00,
                    (invoiceStatus === "paid" || invoiceStatus === "partial") ? "PAID" : "UNPAID"
                ]
            );
            const schoolInst1Id = schoolInst1.rows[0].id;

            const schoolInst2 = await client.query(
                `INSERT INTO school.fee_installment (allocation_id, fee_structure_item_id, invoice_id, amount_due, amount_paid, status, due_date)
                 VALUES ($1, $2, $3, 4000.00, $4, $5, CURRENT_DATE + 30) RETURNING id`,
                [
                    allocationId,
                    item2Id,
                    invoiceId,
                    invoiceStatus === "paid" ? 4000.00 : 0.00,
                    invoiceStatus === "paid" ? "PAID" : "UNPAID"
                ]
            );
            const schoolInst2Id = schoolInst2.rows[0].id;

            // Sync legacy fee_invoice for safety
            const legInvRes = await client.query(
                `INSERT INTO accounting.fee_invoice (tenant_id, invoice_no, student_id, academic_year_id, installment_id, total_amount, net_amount, paid_amount, due_amount, status, due_date)
                 VALUES ($1, $2, $3, $4, $5, 6000.00, 6000.00, $6, $7, $8, CURRENT_DATE - 15)
                 RETURNING id`,
                [
                    tenantId,
                    `${invoiceNo}-L1`,
                    stud.studentId,
                    ayCurrentId,
                    legacyInst1Id,
                    (invoiceStatus === "paid" || invoiceStatus === "partial") ? 6000.00 : 0.00,
                    (invoiceStatus === "paid" || invoiceStatus === "partial") ? 0.00 : 6000.00,
                    (invoiceStatus === "paid" || invoiceStatus === "partial") ? "paid" : "unpaid"
                ]
            );
            const legacyInvoice1Id = legInvRes.rows[0].id;

            // Create ledger journal posting for accounts receivable and tuition revenues
            const jeRes = await client.query(
                `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, status)
                 VALUES ($1, CURRENT_DATE - 20, $2, $3, 'posted')
                 RETURNING id`,
                [tenantId, `JE-BILL-${invoiceNo}`, `Invoiced tuition fees for ${stud.name}`]
            );
            const billingJeId = jeRes.rows[0].id;

            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit)
                 VALUES 
                    ($1, $2, $3, $4, 0.00),
                    ($1, $2, $5, 0.00, $4)`,
                [tenantId, billingJeId, arCoa, totalBill, tuitionRevCoa]
            );

            // If paid or partially paid, create payment transactions and double-entry journal postings
            if (paidAmount > 0) {
                // 1. Insert fee payment
                const pmtRes = await client.query(
                    `INSERT INTO accounting.fee_payment (tenant_id, invoice_id, amount, payment_method, payment_date, receipt_no, student_id, fee_structure_id)
                     VALUES ($1, $2, $3, 'bank_transfer', CURRENT_DATE - 10, $4, $5, $6)
                     RETURNING id`,
                    [tenantId, legacyInvoice1Id, paidAmount, `REC-${3000 + i}`, stud.studentId, acctStructureId]
                );
                const paymentId = pmtRes.rows[0].id;

                // Allocate payment
                await client.query(
                    `INSERT INTO accounting.fee_payment_allocation (tenant_id, payment_id, invoice_id, amount)
                     VALUES ($1, $2, $3, $4)`,
                    [tenantId, paymentId, legacyInvoice1Id, paidAmount]
                );

                // Insert ledger transaction
                const pmtJeRes = await client.query(
                    `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, status)
                     VALUES ($1, CURRENT_DATE - 10, $2, $3, 'posted')
                     RETURNING id`,
                    [tenantId, `JE-PAY-${invoiceNo}`, `Fee collection from ${stud.name}`]
                );
                const paymentJeId = pmtJeRes.rows[0].id;

                await client.query(
                    `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit)
                     VALUES 
                        ($1, $2, $3, $4, 0.00),
                        ($1, $2, $5, 0.00, $4)`,
                    [tenantId, paymentJeId, mainBankCoa, paidAmount, arCoa]
                );

                // Feed a bank transaction record
                await client.query(
                    `INSERT INTO accounting.bank_transaction (tenant_id, bank_account_id, transaction_date, description, amount, type, reference_no)
                     VALUES ($1, $2, CURRENT_DATE - 10, $3, $4, 'credit', $5)`,
                    [tenantId, bankAccountId, `Direct Deposit - tuition fee: ${stud.name}`, paidAmount, `TXN-REC-${3000+i}`]
                );
            }
        }
        console.log("✅ Seeded billing ledgers and completed payments.");

        // ==========================================
        // 15. VENDORS & PROCUREMENT UTILITY
        // ==========================================
        console.log("🚚 Populating suppliers registry and procurement ledger bills...");
        
        const vendors = [
            { name: "Global Book House Publisher", person: "Robert Book", email: "sales@globalbooks.com", phone: "555-0311", billNo: "V-BILL-8890", amount: 8400.00, desc: "Syllabus textbooks printing", coa: booksExpCoa },
            { name: "CleanSpace Hygiene Services", person: "Janet Clean", email: "care@cleanspace.com", phone: "555-0322", billNo: "V-BILL-7712", amount: 1500.00, desc: "Sanitization supplies bulk purchase", coa: rentExpCoa },
            { name: "Modern Furnishing Co", person: "Charles Chair", email: "office@modernfurniture.com", phone: "555-0333", billNo: "V-BILL-9905", amount: 12500.00, desc: "New faculty desks and chairs", coa: assetsGrp } // Capital asset
        ];

        for (let vIdx = 0; vIdx < vendors.length; vIdx++) {
            const v = vendors[vIdx];
            
            // 1. Create vendor
            const vendRes = await client.query(
                `INSERT INTO accounting.vendor (tenant_id, name, contact_person, email, phone)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [tenantId, v.name, v.person, v.email, v.phone]
            );
            const vendorId = vendRes.rows[0].id;

            // Make sure vendor is represented in unified partners table
            await client.query(
                `INSERT INTO accounting.partner (tenant_id, name, email, phone, type, external_ref_type, external_ref_id, is_active)
                 VALUES ($1, $2, $3, $4, 'vendor', 'accounting_vendor', $5, TRUE)
                 ON CONFLICT (tenant_id, external_ref_type, external_ref_id) DO NOTHING`,
                [tenantId, v.name, v.email, v.phone, vendorId]
            );

            // 2. Create bill (First two bills are open/unpaid, third one is paid)
            const billStatus = vIdx === 2 ? "paid" : "open";
            const paidAmt = vIdx === 2 ? v.amount : 0.00;

            const billRes = await client.query(
                `INSERT INTO accounting.vendor_bill (tenant_id, vendor_id, bill_no, bill_date, due_date, total_amount, paid_amount, status)
                 VALUES ($1, $2, $3, CURRENT_DATE - 12, CURRENT_DATE + 18, $4, $5, $6)
                 RETURNING id`,
                [tenantId, vendorId, v.billNo, v.amount, paidAmt, billStatus]
            );
            const billId = billRes.rows[0].id;

            // 3. Create procurement double entry postings (debit expenses, credit AP)
            const billJeRes = await client.query(
                `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, status)
                 VALUES ($1, CURRENT_DATE - 12, $2, $3, 'posted')
                 RETURNING id`,
                [tenantId, `JE-VBILL-${v.billNo}`, `Vendor Bill purchase: ${v.desc}`]
            );
            const billJeId = billJeRes.rows[0].id;

            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit)
                 VALUES 
                    ($1, $2, $3, $4, 0.00),
                    ($1, $2, $5, 0.00, $4)`,
                [tenantId, billJeId, v.coa, v.amount, apCoa]
            );

            // If paid, create payment allocation and bank transaction
            if (vIdx === 2) {
                // Payment entry (debit AP, credit Bank)
                const payJeRes = await client.query(
                    `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, status)
                     VALUES ($1, CURRENT_DATE - 3, $2, $3, 'posted')
                     RETURNING id`,
                    [tenantId, `JE-VPAY-${v.billNo}`, `Vendor Bill payment: ${v.name}`]
                );
                const payJeId = payJeRes.rows[0].id;

                await client.query(
                    `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit)
                     VALUES 
                        ($1, $2, $3, $4, 0.00),
                        ($1, $2, $5, 0.00, $4)`,
                    [tenantId, payJeId, apCoa, v.amount, mainBankCoa]
                );

                // Bank transaction feed
                await client.query(
                    `INSERT INTO accounting.bank_transaction (tenant_id, bank_account_id, transaction_date, description, amount, type, reference_no)
                     VALUES ($1, $2, CURRENT_DATE - 3, $3, $4, 'debit', $5)`,
                    [tenantId, bankAccountId, `Vendor Wire: ${v.name}`, v.amount, `TXN-VPAY-${v.billNo}`]
                );
            }
        }
        console.log("✅ Seeded Vendor Purchases ledgers.");

        // ==========================================
        // 16. SCHOOL STAFF SALARY POSTINGS
        // ==========================================
        console.log("💰 Postings staff payroll expenditures to accounting journals...");
        
        // Double entry posting for March & April salary payments
        // Gross: 6500 per teacher. Mapped: basic (4500) + HRA (1500) + allowance (500) = 6500. Deductions: 200. Net: 6300.
        // Total net payout per month = 6300 * 7 = 44,100
        const totalNetSalaries = 6300.00 * teacherStaffIds.length;

        const salMonths = ["2026-03-31", "2026-04-30"];
        for (let sIdx = 0; sIdx < salMonths.length; sIdx++) {
            const dateStr = salMonths[sIdx];
            
            // Salary expense journal entry
            const salJeRes = await client.query(
                `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, status)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [tenantId, dateStr, `JE-SAL-RUN-${sIdx}`, `Accrued Monthly Salaries disbursement`, "posted"]
            );
            const salJeId = salJeRes.rows[0].id;

            // Debit Salary Expense, Credit Bank
            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit)
                 VALUES 
                    ($1, $2, $3, $4, 0.00),
                    ($1, $2, $5, 0.00, $4)`,
                [tenantId, salJeId, salaryExpCoa, totalNetSalaries, mainBankCoa]
            );

            // Feed bank transaction debit
            await client.query(
                `INSERT INTO accounting.bank_transaction (tenant_id, bank_account_id, transaction_date, description, amount, type, reference_no)
                 VALUES ($1, $2, $3, 'Direct Deposit: Monthly Faculty Salaries Payout', $4, 'debit', $5)`,
                [tenantId, bankAccountId, dateStr, totalNetSalaries, `TXN-SAL-DISB-${sIdx}`]
            );
        }

        // Final sync of Auth state to ensure consistency
        await client.query("SELECT auth.proc_publish_iam_state()");

        await client.query("COMMIT");
        console.log("\n✅ All consolidated seeding completed successfully!");
        process.exit(0);

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("\n❌ Seeding failed, rolled back!");
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
