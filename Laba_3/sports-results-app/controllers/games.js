const express = require('express');
const router = express.Router();
const { getAllGames, getGamesByQuery, addNewGame, deleteGameById } = require('../models/games');

function handleError(res, err) {
  const errorMessage = err ? (err.message || err.toString()) : 'Unknown';
  res.render('error', { message: errorMessage });
}

// Головна сторінка — перегляд усіх ігор
router.get('/', async (_req, res) => {
  try {
    const games = await getAllGames();
    res.render('index', { games });
  } catch (err) {
    handleError(res, err);
  }
});

// Форма додавання нової гри
router.get('/admin', (req, res) => {
  res.render('admin');
});

// Обробка додавання нової гри
router.post('/admin', async (req, res) => {
  const { teamA, teamB, date, result } = req.body;
  const newGame = { teamA, teamB, date, result };
  addNewGame(newGame, (err) => {
    if (!err) {
      res.redirect('/');
    } else {
      handleError(res, err);
    }
  });
});

// Форма пошуку
router.get('/search', (req, res) => {
  res.render('search', { results: [] });
});

// Обробка пошуку
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    const results = await getGamesByQuery(query);
    res.render('search', { results });
  } catch (err) {
    handleError(res, err);
  }
});

// Видалення гри
router.post('/delete/:id', (req, res) => {
  try {
    const gameId = req.params.id;
    deleteGameById(gameId);
    res.redirect('/');
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
