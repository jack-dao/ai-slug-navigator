const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: Sort terms chronologically (Newest First)
// Sorts by Year Descending -> Season Descending (Fall > Summer > Spring > Winter)
const sortTermsDesc = (terms) => {
  const seasonWeight = { 'Winter': 1, 'Spring': 2, 'Summer': 3, 'Fall': 4 };
  
  return terms.sort((a, b) => {
    // Expected format: "2026 Winter Quarter"
    const partsA = a.split(' '); 
    const partsB = b.split(' ');
    
    const yearA = parseInt(partsA[0]);
    const seasonA = partsA[1];
    
    const yearB = parseInt(partsB[0]);
    const seasonB = partsB[1];

    if (yearA !== yearB) {
      return yearB - yearA; // Sort years (2026 before 2025)
    }
    // If years are same, sort seasons (Fall before Winter)
    return (seasonWeight[seasonB] || 0) - (seasonWeight[seasonA] || 0);
  });
};

// Fallback logic if DB is empty
function getSmartTerm() {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 11 = Dec
  const year = now.getFullYear();

  // Winter: Jan(0) to Mar(2)
  if (month <= 2) return `Winter ${year}`;
  // Spring: Apr(3) to Jun(5)
  if (month <= 5) return `Spring ${year}`;
  // Summer: Jul(6) to Aug(7) (Strict cutoff before Sept)
  if (month <= 7) return `Summer ${year}`;
  // Fall: Sep(8) to Dec(11)
  return `Fall ${year}`;
}

const getCourses = async (req, res) => {
  try {
    const { term } = req.query;

    const courses = await prisma.course.findMany({
      where: term ? { term: term } : {}, 
      // 🛑 OPTIMIZATION: Only fetch lightweight fields.
      // We EXCLUDE 'description' and 'prerequisites' here.
      select: {
        id: true,
        code: true,
        name: true,
        credits: true,
        geCode: true,
        career: true,
        grading: true,
        term: true,
        schoolId: true,
        sections: {
          where: { 
            parentId: null 
          },
          orderBy: { 
            sectionNumber: 'asc' 
          },
          include: {
            subSections: {
              orderBy: { sectionNumber: 'asc' }
            }
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Custom sort for "CSE 101" vs "CSE 15" logic
    const sortedCourses = courses.sort((a, b) => {
      const codeA = a.code || ""; 
      const codeB = b.code || "";
      
      const [numA] = codeA.replace("CSE ", "").split(/([0-9]+)/).filter(Boolean);
      const [numB] = codeB.replace("CSE ", "").split(/([0-9]+)/).filter(Boolean);
      
      return (parseInt(numA) || 0) - (parseInt(numB) || 0);
    });

    res.json(sortedCourses);
  } 
  catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// 🆕 NEW: Fetch description/prereqs only when requested
const getCourseDescription = async (req, res) => {
  const { id } = req.params;
  
  // 🛑 FIX START: Parse ID to Integer
  const courseId = parseInt(id);

  if (isNaN(courseId)) {
      return res.status(400).json({ error: "Invalid course ID" });
  }
  // 🛑 FIX END

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId }, // Use the parsed integer here
      select: {
        description: true,
        prerequisites: true
      }
    });
    
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Description Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getSchoolInfo = async (req, res) => {
  try {
    // 1. Ask the DB: "What terms do we actually have?"
    const distinctTerms = await prisma.course.findMany({
      select: { term: true },
      distinct: ['term']
    });

    let termsList = distinctTerms.map(t => t.term).filter(Boolean);
    let latestTerm = null;

    if (termsList.length > 0) {
      // 2. If DB has data, pick the absolute latest one
      const sorted = sortTermsDesc(termsList);
      latestTerm = sorted[0]; 
    } else {
      // 3. Fallback only if DB is empty
      latestTerm = getSmartTerm();
    }

    res.json({
      id: 'ucsc',
      name: 'UC Santa Cruz',
      shortName: 'UCSC',
      term: latestTerm, 
      status: 'active'
    });
  } catch (error) {
    console.error("Metadata Error:", error);
    res.status(500).json({ error: 'Failed to fetch school info' });
  }
};

const getTerms = async (req, res) => {
  try {
    const terms = await prisma.course.findMany({
      select: { term: true },
      distinct: ['term'], 
    });
    
    const sortedTerms = sortTermsDesc(terms.map(t => t.term).filter(Boolean));
    res.json(sortedTerms);
  } catch (error) {
    console.error("Terms Error:", error);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
};

module.exports = {
  getCourses,
  getCourseDescription, // Export the new function
  getSchoolInfo,
  getTerms 
};