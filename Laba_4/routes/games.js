const express = require('express');
const router = express.Router();
const controller = require('../controllers/gamesController');

router.get('/', controller.getAllGames);
router.post('/add', controller.addGame);
router.post('/delete/:id', controller.deleteGame);

module.exports = router;
