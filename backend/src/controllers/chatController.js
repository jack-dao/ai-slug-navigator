const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

const handleChat = async (req, res) => {
  try {
    const { message, contextCourses, userSchedule } = req.body;
    
    const scheduleString = userSchedule && userSchedule.length > 0
      ? userSchedule.map(c => 
          `• ${c.code} (${c.name}): ${c.days} @ ${c.times}`
        ).join('\n')
      : "No classes enrolled yet.";

    const relevantCourses = Array.isArray(contextCourses) ? contextCourses : [];
    
    const courseContextString = relevantCourses.slice(0, 20).map(c => 
      `- ${c.code}: ${c.name} (${c.credits} units). GE: ${c.geCode || "None"}. Prereqs: ${c.prerequisites || "None"}.\n` + 
      `  Sections: ${c.sections?.map(s => 
          `[${s.instructor} | ${s.days} ${s.startTime}-${s.endTime} | Status: ${s.status || 'Unknown'}]`
      ).join(', ') || 'Staff'}`
    ).join('\n');

    const systemPrompt = `
      You are "Sammy", an academic advisor for UC Santa Cruz.
      
      🛑 STEP 1: REVIEW USER'S SCHEDULE
      The user is CURRENTLY ENROLLED in these classes. You MUST respect these times:
      ${scheduleString}

      🛑 STEP 2: USER'S REQUEST
      "${message}"

      🛑 STEP 3: SEARCH CATALOG & CHECK CONFLICTS
      Course Catalog Matches:
      ${courseContextString}

      🚨 IMPORTANT INSTRUCTIONS:
      1. START your response by explicitly confirming you see their schedule.
      2. IF the user asks for a class that "fits", CHECK Step 1. Do NOT recommend classes that overlap with the times listed in Step 1.
      3. IF the user asks for "easy" classes, prioritize high Professor Ratings and lower division numbers (1-99).
      4. IF a class is marked "Status: Closed" or "Waitlist", you MUST warn the user.
      5. Do not write extremely long responses. Keep it conversational.
    `;

    const result = await model.generateContentStream(systemPrompt);

    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-transform'
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
          const chars = chunkText.split("");
          
          for (const char of chars) {
            res.write(char);
            await new Promise(resolve => setTimeout(resolve, 15)); 
          }
      }
    }

    res.end();

  } catch (error) {
    console.error("AI Error:", error);
    
    if (!res.headersSent) {
      res.status(500).json({ reply: "My brain froze! Please try asking again." });
    } else {
      res.end(); 
    }
  }
};

module.exports = {
    handleChat
};