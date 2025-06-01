const express = require('express');
const router = express.Router();
const controller = require('../controllers/teamsController');

// CRUD операції для команд
router.get('/', controller.getAllTeams);              // READ - всі команди
router.post('/add', controller.addTeam);              // CREATE - додати команду
router.get('/edit/:id', controller.getTeamForEdit);   // READ - отримати команду для редагування
router.post('/edit/:id', controller.updateTeam);      // UPDATE - оновити команду
router.post('/delete/:id', controller.deleteTeam);    // DELETE - видалити команду

module.exports = router;