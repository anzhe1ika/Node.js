const express = require('express');
const router = express.Router();
const controller = require('../../controllers/apiController');

// RESTful API для ігор
router.get('/games', controller.getAllGamesAPI);              // GET - отримати всі ігри (з фільтрацією та пагінацією)
router.get('/games/:id', controller.getGameByIdAPI);          // GET - отримати гру за ID
router.post('/games', controller.createGameAPI);              // POST - створити нову гру
router.put('/games/:id', controller.updateGameAPI);           // PUT - оновити гру
router.delete('/games/:id', controller.deleteGameAPI);        // DELETE - видалити гру

// RESTful API для команд
router.get('/teams', controller.getAllTeamsAPI);              // GET - отримати всі команди (з фільтрацією та пагінацією)
router.get('/teams/:id', controller.getTeamByIdAPI);          // GET - отримати команду за ID
router.post('/teams', controller.createTeamAPI);              // POST - створити нову команду
router.put('/teams/:id', controller.updateTeamAPI);           // PUT - оновити команду
router.delete('/teams/:id', controller.deleteTeamAPI);        // DELETE - видалити команду

module.exports = router;