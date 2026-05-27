import fs from 'fs';
import * as xlsx from 'xlsx';

// Data based on CBSE Class 1 English Syllabus (Marigold)
const syllabusData = [
    {
        "Chapter Sequence": 1,
        "Chapter Title": "A Happy Child",
        "Recommended Periods": 6,
        "Topic Sequence": 1,
        "Topic Title": "Recitation of the poem",
        "Learning Outcomes": "Recite the poem with proper rhythm and intonation."
    },
    {
        "Chapter Sequence": 1,
        "Chapter Title": "A Happy Child",
        "Recommended Periods": 6,
        "Topic Sequence": 2,
        "Topic Title": "New Words and Meaning",
        "Learning Outcomes": "Understand and use new vocabulary words (cry, day, red, sun)."
    },
    {
        "Chapter Sequence": 1,
        "Chapter Title": "A Happy Child",
        "Recommended Periods": 6,
        "Topic Sequence": 3,
        "Topic Title": "Tracing and Coloring Activity",
        "Learning Outcomes": "Improve fine motor skills through drawing and coloring."
    },
    {
        "Chapter Sequence": 2,
        "Chapter Title": "Three Little Pigs",
        "Recommended Periods": 8,
        "Topic Sequence": 1,
        "Topic Title": "Story Reading and Comprehension",
        "Learning Outcomes": "Listen to the story and answer simple questions."
    },
    {
        "Chapter Sequence": 2,
        "Chapter Title": "Three Little Pigs",
        "Recommended Periods": 8,
        "Topic Sequence": 2,
        "Topic Title": "Phonics and Sound Words",
        "Learning Outcomes": "Identify basic phonetic sounds and rhyming words."
    },
    {
        "Chapter Sequence": 2,
        "Chapter Title": "Three Little Pigs",
        "Recommended Periods": 8,
        "Topic Sequence": 3,
        "Topic Title": "Creative Writing",
        "Learning Outcomes": "Write simple sentences about the story."
    },
    {
        "Chapter Sequence": 3,
        "Chapter Title": "After a Bath",
        "Recommended Periods": 5,
        "Topic Sequence": 1,
        "Topic Title": "Poem Recitation",
        "Learning Outcomes": "Recite the poem with actions."
    },
    {
        "Chapter Sequence": 3,
        "Chapter Title": "After a Bath",
        "Recommended Periods": 5,
        "Topic Sequence": 2,
        "Topic Title": "Body Parts Vocabulary",
        "Learning Outcomes": "Identify and name various parts of the body."
    },
    {
        "Chapter Sequence": 4,
        "Chapter Title": "The Bubble, the Straw and the Shoe",
        "Recommended Periods": 7,
        "Topic Sequence": 1,
        "Topic Title": "Storytelling and Discussion",
        "Learning Outcomes": "Understand the plot and sequence of events."
    },
    {
        "Chapter Sequence": 4,
        "Chapter Title": "The Bubble, the Straw and the Shoe",
        "Recommended Periods": 7,
        "Topic Sequence": 2,
        "Topic Title": "Action Words (Verbs)",
        "Learning Outcomes": "Identify action words like jump, float, stretch."
    }
];

const qbData = [
    {
        "Topic ID": "Topic 1", 
        "Question Text": "What is the color of the happy child's house?",
        "Question Type": "MCQ",
        "Difficulty Level": "Easy",
        "Marks": 1,
        "Option A": "Blue",
        "Option B": "Red",
        "Option C": "Green",
        "Option D": "Yellow",
        "Correct Answer": "Option B",
        "Solution/Explanation": "The poem says 'My house is red - a little house'."
    },
    {
        "Topic ID": "Topic 4", 
        "Question Text": "Who blew the houses down?",
        "Question Type": "MCQ",
        "Difficulty Level": "Easy",
        "Marks": 1,
        "Option A": "The pig",
        "Option B": "The dog",
        "Option C": "The wolf",
        "Option D": "The cat",
        "Correct Answer": "Option C",
        "Solution/Explanation": "The big bad wolf blew the houses down."
    },
    {
        "Topic ID": "Topic 8", 
        "Question Text": "Name two parts of your body that you wipe after a bath.",
        "Question Type": "Short Answer",
        "Difficulty Level": "Medium",
        "Marks": 2,
        "Option A": "",
        "Option B": "",
        "Option C": "",
        "Option D": "",
        "Correct Answer": "",
        "Solution/Explanation": "Hands, fingers, toes, legs."
    }
];

const metadata = [
    { "Key": "Board", "Value": "CBSE" },
    { "Key": "Grade", "Value": "Grade 1" },
    { "Key": "Subject", "Value": "English" },
    { "Key": "Version", "Value": "1.0" },
    { "Key": "Title", "Value": "CBSE Class 1 English Marigold" },
    { "Key": "Description", "Value": "Official syllabus for Class 1 English." }
];

function generateExcel() {
    const wb = xlsx.utils.book_new();

    const wsSyllabus = xlsx.utils.json_to_sheet(syllabusData);
    xlsx.utils.book_append_sheet(wb, wsSyllabus, "Syllabus");

    const wsQB = xlsx.utils.json_to_sheet(qbData);
    xlsx.utils.book_append_sheet(wb, wsQB, "Question Bank");

    const wsMeta = xlsx.utils.json_to_sheet(metadata);
    xlsx.utils.book_append_sheet(wb, wsMeta, "Metadata");

    const filePath = './CBSE_Class1_English_Syllabus.xlsx';
    xlsx.writeFile(wb, filePath);
    console.log(`Excel file generated successfully at: ${filePath}`);
}

generateExcel();
