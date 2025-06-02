const express = require('express');
const router = express.Router();
const controller = require('../controllers/gamesController');

// CRUD операції для ігор
router.get('/', controller.getAllGames);              // READ - всі ігри
router.post('/add', controller.addGame);              // CREATE - додати гру
router.get('/edit/:id', controller.getGameForEdit);   // READ - отримати гру для редагування
router.post('/edit/:id', controller.updateGame);      // UPDATE - оновити гру
router.post('/delete/:id', controller.deleteGame);    // DELETE - видалити гру

// Додаткові маршрути
router.post('/tournament', controller.createTournament); // Бізнес-операція

module.exports = router;