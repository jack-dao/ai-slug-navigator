const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function exportForRMP(schoolKey) {
  const allCourses = await prisma.course.findMany({
    where: { school: { name: schoolKey.toUpperCase() } },
    include: { sections: true }
  });

  const instructorMap = {};
  allCourses.forEach(course => {
    course.sections.forEach(section => {
      if (section.instructor && section.instructor !== "Staff") {
        if (!instructorMap[section.instructor]) instructorMap[section.instructor] = new Set();
        instructorMap[section.instructor].add(course.code.replace(/\s/g, ""));
      }
    });
  });

  const formattedData = Object.keys(instructorMap).map(name => ({
    instructor: name,
    courses: Array.from(instructorMap[name])
  }));

  const outputPath = path.join(__dirname, '../src/data', `availableCourses_${schoolKey}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2));
}

async function run() {
  await exportForRMP('ucsc');
  await prisma.$disconnect();
}
run();