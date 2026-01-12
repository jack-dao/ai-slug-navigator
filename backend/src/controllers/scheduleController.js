const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const saveSchedule = async (req, res) => {
    try {
        const { name, courses } = req.body;
        const userId = req.user.userId;

        if (!courses) {
            return res.status(400).json({ error: 'Courses are required' });
        }

        // Delete existing schedule to overwrite
        await prisma.schedule.deleteMany({
            where: { userId: userId }
        });

        const schedule = await prisma.schedule.create({
            data: {
                name: name || 'My Schedule',
                courses, 
                userId
            },
        });

        res.status(200).json(schedule);
    }
    catch (error) {
        console.error('Save error:', error);
        
        // ⚡️ FIX: Handle "User Not Found" (Prisma P2003 = Foreign Key Fail)
        if (error.code === 'P2003') {
            return res.status(401).json({ error: 'User account no longer exists. Please log out and sign up again.' });
        }

        res.status(500).json({ error: 'Failed to save schedule' });
    }
};

const getSchedules = async (req, res) => {
    try {
        const userId = req.user.userId;
        const schedule = await prisma.schedule.findFirst({
            where: { userId: userId },
            orderBy: { createdAt: 'desc'}
        });
        
        if (!schedule) {
             return res.json({ courses: [] });
        }

        res.json(schedule);
    }
    catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};

module.exports = {
    saveSchedule,
    getSchedules
};