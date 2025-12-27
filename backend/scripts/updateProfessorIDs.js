const fs = require('fs');
const path = require('path');
const axios = require('axios');

// UCSC's base64 encoded School ID on RateMyProfessor
const SCHOOL_ID = "U2Nob29sLTEwNzg=";

/**
 * Cleans UCSC names: "Moulds,G.B." -> ["Moulds", "G"]
 */
function getPisaName(instructorName) {
    let splitName = instructorName.split(",");
    let lastName = splitName[0];
    let firstInitial = splitName[1] ? splitName[1].split(".")[0] : "";
    return [lastName, firstInitial];
}

/**
 * Custom RMP Search using GraphQL (No external library required)
 */
async function searchRMP(instructorName) {
    const [lastName, firstInitial] = getPisaName(instructorName);
    const queryText = `${lastName} ${firstInitial}`;

    try {
        const resp = await axios.post("https://www.ratemyprofessors.com/graphql", {
            query: `query NewSearchTeachersQuery($query: TeacherSearchQuery!) {
                newSearch {
                  teachers(query: $query) {
                    edges {
                      node {
                        id
                        legacyId
                        lastName
                      }
                    }
                  }
                }
            }`,
            variables: {
                query: {
                    schoolID: SCHOOL_ID,
                    text: queryText
                }
            }
        }, {
            headers: {
                Authorization: "Basic dGVzdDp0ZXN0", // Guest account auth
                "Content-Type": "application/json"
            }
        });

        const teachers = resp.data?.data?.newSearch?.teachers?.edges || [];
        if (teachers.length === 0) return null;

        // Exact match check: Ensure last name matches exactly
        const bestMatch = teachers.find(t => 
            t.node.lastName.toLowerCase().includes(lastName.toLowerCase())
        );

        return bestMatch ? bestMatch.node.legacyId : null;

    } catch (err) {
        console.log(`   ⚠️ API error for ${instructorName}: ${err.message}`);
        return null;
    }
}

async function buildMap() {
    const coursesPath = path.join(__dirname, '../src/data/availableCourses.json');
    const rmpIdsPath = path.join(__dirname, '../src/data/rmp_ids.json');

    try {
        // Create directory if missing
        if (!fs.existsSync(path.dirname(coursesPath))) {
            fs.mkdirSync(path.dirname(coursesPath), { recursive: true });
        }

        const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
        const instructorSet = new Set();
        courses.forEach(c => c.sections?.forEach(s => {
            if (s.instructor && s.instructor !== "Staff") instructorSet.add(s.instructor);
        }));

        let map = fs.existsSync(rmpIdsPath) ? JSON.parse(fs.readFileSync(rmpIdsPath, 'utf8')) : {};
        let count = 0;

        console.log(`🚀 Starting RMP ID sync for ${instructorSet.size} unique instructors...`);

        for (const name of instructorSet) {
            if (map[name]) continue;

            console.log(`🔍 Searching: ${name}`);
            const rmpId = await searchRMP(name);

            if (rmpId) {
                map[name] = rmpId;
                count++;
                console.log(`   ✅ Matched ID: ${rmpId}`);
            } else {
                console.log(`   ❌ No match found.`);
            }

            // Standard 1-second delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }

        fs.writeFileSync(rmpIdsPath, JSON.stringify(map, null, 2));
        console.log(`\n🎉 Success! Added ${count} IDs. Total: ${Object.keys(map).length}`);

    } catch (err) {
        console.error("Fatal Error:", err.message);
    }
}

buildMap();