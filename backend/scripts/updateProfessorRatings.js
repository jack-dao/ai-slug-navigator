const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function fetchAndRecalculateRatings(legacyId) {
    const b64Id = Buffer.from(`Teacher-${legacyId}`).toString('base64');

    try {
        const resp = await axios.post("https://www.ratemyprofessors.com/graphql", {
            query: `query ($id: ID!) {
                node(id: $id) {
                  ... on Teacher {
                    firstName
                    lastName
                    avgRating
                    numRatings
                    avgDifficulty
                    wouldTakeAgainPercent
                    ratings(first: 20) { # Fetch 20 reviews for recalculation
                      edges {
                        node {
                          comment
                          date
                          class
                          grade
                          helpfulRating
                          clarityRating
                          difficultyRating
                          wouldTakeAgain
                        }
                      }
                    }
                  }
                }
            }`,
            variables: { id: b64Id }
        }, {
            headers: { Authorization: "Basic dGVzdDp0ZXN0", "Content-Type": "application/json" }
        });

        const instructor = resp.data?.data?.node;
        if (!instructor) return null;

        const reviews = instructor.ratings.edges.map(e => {
            const raw = e.node;
            return {
                comment: raw.comment,
                date: raw.date,
                course: raw.class,
                grade: raw.grade,
                rating: (raw.helpfulRating + raw.clarityRating) / 2,
                difficulty: raw.difficultyRating,
                wouldTakeAgain: raw.wouldTakeAgain === 1
            };
        });

        const totalFetched = reviews.length;
        let finalAvgRating = instructor.avgRating;
        let finalAvgDifficulty = instructor.avgDifficulty;

        if (instructor.numRatings === 0 || instructor.numRatings < totalFetched || (instructor.avgRating === 0 && instructor.avgDifficulty === 0)) {
            if (totalFetched > 0) {
                finalAvgRating = reviews.reduce((a, b) => a + b.rating, 0) / totalFetched;
                finalAvgDifficulty = reviews.reduce((a, b) => a + b.difficulty, 0) / totalFetched;
            }
        }

        return {
            name: `${instructor.firstName} ${instructor.lastName}`,
            avgRating: parseFloat(finalAvgRating.toFixed(1)),
            avgDifficulty: parseFloat(finalAvgDifficulty.toFixed(1)),
            numRatings: instructor.numRatings || totalFetched,
            wouldTakeAgain: instructor.wouldTakeAgainPercent !== -1 ? Math.round(instructor.wouldTakeAgainPercent) : "N/A",
            reviews: reviews 
        };
    } catch (err) {
        console.log(`   ⚠️ Error fetching data for ID ${legacyId}: ${err.message}`);
        return null;
    }
}

async function buildRatingsMap() {
    const dataDir = path.join(__dirname, '../src/data');
    const idsPath = path.join(dataDir, 'rmp_ids.json');
    const ratingsPath = path.join(dataDir, 'rmp_ratings.json');

    try {
        if (!fs.existsSync(idsPath)) return console.error("❌ Run updateProfessorIDs.js first.");

        const idMap = JSON.parse(fs.readFileSync(idsPath, 'utf8'));
        let ratingsMap = {};
        
        const names = Object.keys(idMap);
        console.log(`🚀 Refreshing ratings for ${names.length} professors...`);

        for (const name of names) {
            console.log(`📊 Processing: ${name}`);
            const data = await fetchAndRecalculateRatings(idMap[name]);
            
            if (data) {
                ratingsMap[name] = data;
                console.log(`   ✅ Success: ${data.avgRating}/5 (${data.numRatings} ratings)`);
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        fs.writeFileSync(ratingsPath, JSON.stringify(ratingsMap, null, 2));
        console.log(`\n🎉 Success! Recalculated data saved to rmp_ratings.json`);
    } catch (err) {
        console.error("Fatal Error:", err.message);
    }
}

buildRatingsMap();