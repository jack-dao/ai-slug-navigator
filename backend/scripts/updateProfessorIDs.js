const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SCHOOL_ID = "U2Nob29sLTEwNzg="; // UCSC's RMP ID

function getPisaName(instructorName) {
    let splitName = instructorName.split(",");
    let lastName = splitName[0];
    let firstInitial = splitName[1] ? splitName[1].split(".")[0] : "";
    return [lastName, firstInitial];
}

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
                        legacyId
                        lastName
                      }
                    }
                  }
                }
            }`,
            variables: { query: { schoolID: SCHOOL_ID, text: queryText } }
        }, {
            headers: {
                Authorization: "Basic dGVzdDp0ZXN0", // Guest account auth
                "Content-Type": "application/json"
            }
        });

        const teachers = resp.data?.data?.newSearch?.teachers?.edges || [];
        if (teachers.length === 0) return null;

        // Ensure the last name actually matches to avoid wrong schools
        const bestMatch = teachers.find(t => 
            t.node.lastName.toLowerCase().includes(lastName.toLowerCase())
        );

        return bestMatch ? bestMatch.node.legacyId : null;
    } catch (err) {
        return null;
    }
}

async function buildMap() {
    const dataDir = path.join(__dirname, '../src/data');
    const coursesPath = path.join(dataDir, 'availableCourses.json');
    const rmpIdsPath = path.join(dataDir, 'rmp_ids.json');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    try {
        const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
        const instructorSet = new Set();
        courses.forEach(c => c.sections?.forEach(s => {
            if (s.instructor && s.instructor !== "Staff") instructorSet.add(s.instructor);
        }));

        // If rmp_ids.json doesn't exist, start with an empty object {}
        let map = fs.existsSync(rmpIdsPath) ? JSON.parse(fs.readFileSync(rmpIdsPath, 'utf8')) : {};
        
        console.log(`Starting search for ${instructorSet.size} instructors...`);

        for (const name of instructorSet) {
            if (map[name]) continue;

            console.log(`🔍 Searching RMP for: ${name}`);
            const id = await searchRMP(name);
            
            if (id) {
                map[name] = id;
                console.log(`   ✅ Found: ${id}`);
            } else {
                console.log(`   ❌ No match.`);
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        // This line creates the rmp_ids.json file for the first time
        fs.writeFileSync(rmpIdsPath, JSON.stringify(map, null, 2));
        console.log("Successfully saved rmp_ids.json");

    } catch (err) {
        console.error("Error:", err.message);
    }
}

buildMap();