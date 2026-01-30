const express = require('express');
const cors = require('cors');
const compression = require('compression'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',                  
  'https://ai-course-navigator.vercel.app', 
  'https://aislugnavigator.com',            
  'https://www.aislugnavigator.com',
  'https://ai-slug-navigator.onrender.com'          
];

app.use(compression({
  filter: (req, res) => {
    if (req.path.includes('/api/chat')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const courseRoutes = require('./src/routes/courseRoutes');
const authRoutes = require('./src/routes/authRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const ratingsRoutes = require('./src/routes/ratingsRoutes'); 
const chatRoutes = require('./src/routes/chatRoutes');


app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/chat', chatRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});