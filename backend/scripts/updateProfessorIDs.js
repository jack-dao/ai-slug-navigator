const fs = require('fs');
const path = require('path');
const axios = require('axios');

const dataDir = path.join(__dirname, '../src/data');
const schools = JSON.parse(fs.readFileSync(path.join(dataDir, 'schools.json'), 'utf8'));

async function postWithRetry(url, data, config, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try { return await axios.post(url, data, config); } 
        catch (err) {
            if ((err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') && i < retries - 1) {
                await new Promise(r => setTimeout(r, 3000));
                continue;
            }
            throw err;
        }
    }
}

function getPisaName(name) {
    const split = name.split(",");
    const lastName = split[0].trim();
    const firstInitial = split[1] ? split[1].trim().charAt(0) : "";
    return { lastName, firstInitial };
}

async function searchRMP(queryText, schoolRmpId) {
    const resp = await postWithRetry("https://www.ratemyprofessors.com/graphql", {
        query: `query ($query: TeacherSearchQuery!) {
            newSearch { teachers(query: $query) { edges { node { 
                legacyId firstName lastName department 
                courseCodes { courseName } 
            } } } }
        }`,
        variables: { query: { schoolID: schoolRmpId, text: queryText } }
    }, { headers: { Authorization: "Basic dGVzdDp0ZXN0", "Content-Type": "application/json" } });
    return resp.data?.data?.newSearch?.teachers?.edges || [];
}

async function buildMap() {
    const rmpIdsPath = path.join(dataDir, 'rmp_ids.json');
    let map = fs.existsSync(rmpIdsPath) ? JSON.parse(fs.readFileSync(rmpIdsPath, 'utf8')) : {};

    for (const [schoolKey, schoolData] of Object.entries(schools)) {
        const coursesFile = path.join(dataDir, `availableCourses_${schoolKey}.json`);
        if (!fs.existsSync(coursesFile)) continue;
        const instructors = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));

        for (const { instructor: name, courses: pisaCourses } of instructors) {
            if (map[name]) continue;

            const { lastName, firstInitial } = getPisaName(name);
            const deptPrefix = pisaCourses[0].replace(/[0-9].*/, ""); 

            console.log(`🔍 Scoring candidates for: ${name} (${pisaCourses.join(", ")})`);
            
            let results = await searchRMP(`${lastName} ${firstInitial}`, schoolData.rmpId);
            if (results.length === 0) results = await searchRMP(lastName, schoolData.rmpId);

            const candidates = results.map(x => x.node);
            if (candidates.length === 0) continue;

            const scores = candidates.map(ins => {
                let score = 0;
                score += (ins.lastName.toLowerCase().endsWith(lastName.toLowerCase()) ? 1 : -10);
                score += (ins.firstName.startsWith(firstInitial) ? 1 : -1);
                
                const taughtCourses = ins.courseCodes.map(c => c.courseName.replace(/\s/g, ""));
                const taughtDepts = taughtCourses.map(c => c.replace(/[0-9].*/, ""));

                if (taughtDepts.includes(deptPrefix) || (ins.department && ins.department.includes(deptPrefix))) score += 1;
                if (taughtCourses.some(c => pisaCourses.includes(c))) score += 5;
                
                return score;
            });

            const bestIndex = scores.indexOf(Math.max(...scores));
            const best = candidates[bestIndex];

            if (scores[bestIndex] > 0 && best.lastName.toLowerCase().endsWith(lastName.toLowerCase()) && best.firstName.startsWith(firstInitial)) {
                map[name] = best.legacyId;
                console.log(`   ✅ Matched: ${best.firstName} ${best.lastName} (Score: ${scores[bestIndex]})`);
            } 
            else {
                console.log(`   ❌ No confident match found (Top score: ${scores[bestIndex]})`);
            }

            fs.writeFileSync(rmpIdsPath, JSON.stringify(map, null, 2));
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}
buildMap();