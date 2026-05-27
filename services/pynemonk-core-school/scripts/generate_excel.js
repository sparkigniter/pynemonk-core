import fs from 'fs';
import * as xlsx from 'xlsx';

// Data based on Karnataka State Board Class 9 Mathematics Syllabus
const syllabusData = [
    {
        "Chapter Sequence": 1,
        "Chapter Title": "Number System",
        "Recommended Periods": 8,
        "Topic Sequence": 1,
        "Topic Title": "Introduction to Rational Numbers",
        "Learning Outcomes": "Understand rational numbers and represent them on a number line."
    },
    {
        "Chapter Sequence": 1,
        "Chapter Title": "Number System",
        "Recommended Periods": 8,
        "Topic Sequence": 2,
        "Topic Title": "Irrational Numbers",
        "Learning Outcomes": "Identify irrational numbers and prove irrationality of root 2, 3, etc."
    },
    {
        "Chapter Sequence": 1,
        "Chapter Title": "Number System",
        "Recommended Periods": 8,
        "Topic Sequence": 3,
        "Topic Title": "Real Numbers and their Decimal Expansions",
        "Learning Outcomes": "Convert decimals to fractions and vice versa."
    },
    {
        "Chapter Sequence": 1,
        "Chapter Title": "Number System",
        "Recommended Periods": 8,
        "Topic Sequence": 4,
        "Topic Title": "Laws of Exponents for Real Numbers",
        "Learning Outcomes": "Apply exponent laws to simplify real number expressions."
    },
    {
        "Chapter Sequence": 2,
        "Chapter Title": "Polynomials",
        "Recommended Periods": 10,
        "Topic Sequence": 1,
        "Topic Title": "Polynomials in One Variable",
        "Learning Outcomes": "Define polynomials, degrees, coefficients, and terms."
    },
    {
        "Chapter Sequence": 2,
        "Chapter Title": "Polynomials",
        "Recommended Periods": 10,
        "Topic Sequence": 2,
        "Topic Title": "Zeroes of a Polynomial",
        "Learning Outcomes": "Calculate the zero of a linear and quadratic polynomial."
    },
    {
        "Chapter Sequence": 2,
        "Chapter Title": "Polynomials",
        "Recommended Periods": 10,
        "Topic Sequence": 3,
        "Topic Title": "Factorisation of Polynomials",
        "Learning Outcomes": "Use splitting the middle term and factor theorem."
    },
    {
        "Chapter Sequence": 2,
        "Chapter Title": "Polynomials",
        "Recommended Periods": 10,
        "Topic Sequence": 4,
        "Topic Title": "Algebraic Identities",
        "Learning Outcomes": "Apply standard algebraic identities to factorize expressions."
    },
    {
        "Chapter Sequence": 3,
        "Chapter Title": "Coordinate Geometry",
        "Recommended Periods": 5,
        "Topic Sequence": 1,
        "Topic Title": "Cartesian System",
        "Learning Outcomes": "Locate points in a Cartesian plane using x and y coordinates."
    },
    {
        "Chapter Sequence": 3,
        "Chapter Title": "Coordinate Geometry",
        "Recommended Periods": 5,
        "Topic Sequence": 2,
        "Topic Title": "Plotting a Point in the Plane",
        "Learning Outcomes": "Plot specific coordinates given on a graph."
    },
    {
        "Chapter Sequence": 4,
        "Chapter Title": "Linear Equations in Two Variables",
        "Recommended Periods": 7,
        "Topic Sequence": 1,
        "Topic Title": "Linear Equations",
        "Learning Outcomes": "Understand the standard form ax + by + c = 0."
    },
    {
        "Chapter Sequence": 4,
        "Chapter Title": "Linear Equations in Two Variables",
        "Recommended Periods": 7,
        "Topic Sequence": 2,
        "Topic Title": "Graph of a Linear Equation",
        "Learning Outcomes": "Draw straight lines corresponding to linear equations."
    },
    {
        "Chapter Sequence": 5,
        "Chapter Title": "Introduction to Euclid's Geometry",
        "Recommended Periods": 4,
        "Topic Sequence": 1,
        "Topic Title": "Euclid's Definitions, Axioms and Postulates",
        "Learning Outcomes": "Understand the historical context and basic geometric postulates."
    },
    {
        "Chapter Sequence": 6,
        "Chapter Title": "Lines and Angles",
        "Recommended Periods": 8,
        "Topic Sequence": 1,
        "Topic Title": "Basic Terms and Definitions",
        "Learning Outcomes": "Identify acute, right, obtuse, straight, and reflex angles."
    },
    {
        "Chapter Sequence": 6,
        "Chapter Title": "Lines and Angles",
        "Recommended Periods": 8,
        "Topic Sequence": 2,
        "Topic Title": "Intersecting Lines and Non-intersecting Lines",
        "Learning Outcomes": "Understand vertically opposite angles and transversals."
    }
];

const worksheet = xlsx.utils.json_to_sheet(syllabusData);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Syllabus");

const outputPath = '/Users/vikas/projects/pynemonk/Karnataka_Class9_Maths_Syllabus.xlsx';
xlsx.writeFile(workbook, outputPath);

console.log(`Excel file generated successfully at: ${outputPath}`);
