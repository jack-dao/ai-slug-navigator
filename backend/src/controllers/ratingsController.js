const fs = require('fs');
const path = require('path');

const getRatings = (req, res) => {
  const ratingsPath = path.join(__dirname, '../data/rmp_ratings.json');
  
  if (fs.existsSync(ratingsPath)) {
    try {
      const data = fs.readFileSync(ratingsPath, 'utf8');
      res.json(JSON.parse(data));
    } 
    catch (err) {
      res.status(500).json({ error: "Failed to read ratings" });
    }
  } 
  else {
    res.json({});
  }
};

module.exports = {
    getRatings
};