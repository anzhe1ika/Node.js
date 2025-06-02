const { sequelize, Team, Game } = require('../models');

// READ - Отримати всі ігри
async function getAllGames(req, res) {
  try {
    const games = await Game.findAll({
      include: [
        { model: Team, as: 'team1', attributes: ['name'] },
        { model: Team, as: 'team2', attributes: ['name'] }
      ],
      order: [['game_date', 'DESC']]
    });

    const teams = await Team.findAll({
      order: [['name', 'ASC']]
    });

    res.render('index', { games, teams });
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).send('Database error: ' + err.message);
  }
}

// CREATE - Додати нову гру
async function addGame(req, res) {
  const { game_date, team1_id, team2_id, score1, score2 } = req.body;
  
  // Валідація
  if (team1_id === team2_id) {
    return res.status(400).send('Team cannot play against itself');
  }

  const transaction = await sequelize.transaction();
  
  try {
    // Перевіряємо, чи існують команди
    const team1 = await Team.findByPk(team1_id, { transaction });
    const team2 = await Team.findByPk(team2_id, { transaction });
    
    if (!team1 || !team2) {
      throw new Error('One or both teams do not exist');
    }

    // Створюємо гру
    await Game.create({
      game_date,
      team1_id: parseInt(team1_id),
      team2_id: parseInt(team2_id),
      score_team1: parseInt(score1) || 0,
      score_team2: parseInt(score2) || 0
    }, { transaction });

    // Підтверджуємо транзакцію
    await transaction.commit();
    res.redirect('/');
  } catch (err) {
    // Відкатуємо транзакцію при помилці
    await transaction.rollback();
    console.error('Error adding game:', err);
    res.status(500).send('Insert error: ' + err.message);
  }
}

// READ - Отримати гру для редагування
async function getGameForEdit(req, res) {
  const { id } = req.params;
  
  try {
    const game = await Game.findByPk(id, {
      include: [
        { model: Team, as: 'team1' },
        { model: Team, as: 'team2' }
      ]
    });

    if (!game) {
      return res.status(404).send('Game not found');
    }

    const teams = await Team.findAll({
      order: [['name', 'ASC']]
    });

    res.render('edit', { game, teams });
  } catch (err) {
    console.error('Error fetching game:', err);
    res.status(500).send('Database error: ' + err.message);
  }
}

// UPDATE - Оновити гру
async function updateGame(req, res) {
  const { id } = req.params;
  const { game_date, team1_id, team2_id, score1, score2 } = req.body;
  
  // Валідація
  if (team1_id === team2_id) {
    return res.status(400).send('Team cannot play against itself');
  }

  const transaction = await sequelize.transaction();
  
  try {
    // Знаходимо гру
    const game = await Game.findByPk(id, { transaction });
    if (!game) {
      throw new Error('Game not found');
    }

    // Перевіряємо команди
    const team1 = await Team.findByPk(team1_id, { transaction });
    const team2 = await Team.findByPk(team2_id, { transaction });
    
    if (!team1 || !team2) {
      throw new Error('One or both teams do not exist');
    }

    // Оновлюємо гру
    await game.update({
      game_date,
      team1_id: parseInt(team1_id),
      team2_id: parseInt(team2_id),
      score_team1: parseInt(score1) || 0,
      score_team2: parseInt(score2) || 0
    }, { transaction });

    // Підтверджуємо транзакцію
    await transaction.commit();
    res.redirect('/');
  } catch (err) {
    // Відкатуємо транзакцію при помилці
    await transaction.rollback();
    console.error('Error updating game:', err);
    res.status(500).send('Update error: ' + err.message);
  }
}

// DELETE - Видалити гру (з транзакцією)
async function deleteGame(req, res) {
  const { id } = req.params;
  const transaction = await sequelize.transaction();
  
  try {
    const game = await Game.findByPk(id, { transaction });
    if (!game) {
      throw new Error('Game not found');
    }

    await game.destroy({ transaction });
    
    // Підтверджуємо транзакцію
    await transaction.commit();
    res.redirect('/');
  } catch (err) {
    // Відкатуємо транзакцію при помилці
    await transaction.rollback();
    console.error('Error deleting game:', err);
    res.status(500).send('Delete error: ' + err.message);
  }
}

// Створення турніру з декількома іграми
async function createTournament(req, res) {
  const { tournament_name, games } = req.body; // games - масив об'єктів ігор
  const transaction = await sequelize.transaction();

  try {
    // Перевіряємо, що всі команди існують
    const teamIds = [...new Set(games.flatMap(g => [g.team1_id, g.team2_id]))];
    const teams = await Team.findAll({
      where: { id: teamIds },
      transaction
    });

    if (teams.length !== teamIds.length) {
      throw new Error('Some teams do not exist');
    }

    // Перевіряємо, що немає ігор з однаковими командами
    for (const game of games) {
      const team1Id = parseInt(game.team1_id);
      const team2Id = parseInt(game.team2_id);

      if (isNaN(team1Id) || isNaN(team2Id)) {
        throw new Error('Invalid team ID');
      }

      if (team1Id === team2Id) {
        throw new Error(`Game on ${game.game_date} has identical teams (ID: ${team1Id})`);
      }
    }

    // Перевіряємо, що немає дублікатів ігор в один день між тими ж командами
    for (let i = 0; i < games.length; i++) {
      for (let j = i + 1; j < games.length; j++) {
        const game1 = games[i];
        const game2 = games[j];

        if (game1.game_date === game2.game_date &&
          ((game1.team1_id === game2.team1_id && game1.team2_id === game2.team2_id) ||
            (game1.team1_id === game2.team2_id && game1.team2_id === game2.team1_id))) {
          throw new Error('Duplicate games found in tournament');
        }
      }
    }

    // Створюємо всі ігри турніру
    const createdGames = [];
    for (const gameData of games) {
      const game = await Game.create({
        game_date: gameData.game_date,
        team1_id: parseInt(gameData.team1_id),
        team2_id: parseInt(gameData.team2_id),
        score_team1: parseInt(gameData.score1) || 0,
        score_team2: parseInt(gameData.score2) || 0
      }, { transaction });

      createdGames.push(game);
    }

    // Підтверджуємо транзакцію - всі ігри створені успішно
    await transaction.commit();

    res.json({
      success: true,
      message: `Tournament "${tournament_name}" created successfully`,
      games: createdGames.length
    });
  } catch (err) {
    // Відкатуємо транзакцію - жодна гра не буде створена
    await transaction.rollback();
    console.error('Error creating tournament:', err);
    res.status(500).json({
      success: false,
      message: 'Tournament creation failed: ' + err.message
    });
  }
}

module.exports = {
  getAllGames,
  addGame,
  getGameForEdit,
  updateGame,
  deleteGame,
  createTournament,
};