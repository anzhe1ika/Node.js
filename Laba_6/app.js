const express = require('express');
const path = require('path');
const app = express();

// Імпорт роутерів
const gamesRouter = require('./routes/games');
const teamsRouter = require('./routes/teams');
const apiRouter = require('./routes/api/games'); // API роутер
const { initializeDatabase } = require('./models');

// Налаштування шаблонізатора
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Для підтримки JSON
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware для API
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Sports Management System API',
    version: '1.0.0',
    endpoints: {
      games: {
        'GET /api/games': 'Get all games (with filtering and pagination)',
        'GET /api/games/:id': 'Get game by ID',
        'POST /api/games': 'Create new game',
        'PUT /api/games/:id': 'Update game',
        'DELETE /api/games/:id': 'Delete game'
      },
      teams: {
        'GET /api/teams': 'Get all teams (with filtering and pagination)',
        'GET /api/teams/:id': 'Get team by ID',
        'POST /api/teams': 'Create new team',
        'PUT /api/teams/:id': 'Update team',
        'DELETE /api/teams/:id': 'Delete team'
      }
    },
    query_parameters: {
      pagination: 'page, limit',
      games_filtering: 'team1_id, team2_id, date_from, date_to, min_score, max_score',
      teams_filtering: 'name, city, founded_year_from, founded_year_to'
    }
  });
});

// Роути
app.use('/api', apiRouter);  // API роути
app.use('/', gamesRouter);   // Веб-інтерфейс для ігор
app.use('/teams', teamsRouter); // Веб-інтерфейс для команд

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  } else {
    res.status(404).send('Page not found');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  if (req.path.startsWith('/api')) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } else {
    res.status(500).send('Internal server error');
  }
});

const PORT = process.env.PORT || 3000;

// Ініціалізація бази даних перед запуском сервера
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Web interface: http://localhost:${PORT}`);
      console.log(`API documentation: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();