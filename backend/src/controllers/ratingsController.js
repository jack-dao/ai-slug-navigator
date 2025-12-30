const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getRatings = async (req, res) => {
  try {
    const professors = await prisma.professor.findMany({
      where: { rating: { not: null } }
    });

    const ratingsMap = {};
    
    professors.forEach(prof => {
      ratingsMap[prof.name] = {
        avgRating: prof.rating,
        avgDifficulty: prof.difficulty,
        numRatings: prof.numRatings,
        rmpId: prof.rmpId,
        reviews: prof.reviews || [] 
      };
    });

    res.json(ratingsMap);
  } catch (err) {
    console.error("Error fetching ratings from DB:", err);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
};

module.exports = { getRatings };