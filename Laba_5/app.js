const express = require('express');
const path = require('path');
const app = express();
const gamesRouter = require('./routes/games');
const teamsRouter = require('./routes/teams');
const { initializeDatabase } = require('./models');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Додано для підтримки JSON
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', gamesRouter);
app.use('/teams', teamsRouter);

const PORT = 3000;

// Ініціалізація бази даних перед запуском сервера
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log('Server is running on http://localhost:' + PORT);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();