const { sequelize, Team, Game } = require('../models');
const { Op } = require('sequelize');

// Обробка помилок
const handleError = (res, error, defaultMessage = 'Internal server error') => {
  console.error('API Error:', error);
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(err => err.message)
    });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: error.message
    });
  }
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: error.message
  });
};

// GET /api/games - Отримати всі ігри з фільтрацією та пагінацією
async function getAllGamesAPI(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      team1_id,
      team2_id,
      date_from,
      date_to,
      min_score,
      max_score,
      sort_by = 'game_date',
      sort_order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Побудова умов фільтрації
    const whereConditions = {};
    
    if (team1_id) whereConditions.team1_id = team1_id;
    if (team2_id) whereConditions.team2_id = team2_id;
    
    if (date_from || date_to) {
      whereConditions.game_date = {};
      if (date_from) whereConditions.game_date[Op.gte] = new Date(date_from);
      if (date_to) whereConditions.game_date[Op.lte] = new Date(date_to);
    }

    if (min_score || max_score) {
      const scoreConditions = [];
      if (min_score) {
        scoreConditions.push(
          { score_team1: { [Op.gte]: parseInt(min_score) } },
          { score_team2: { [Op.gte]: parseInt(min_score) } }
        );
      }
      if (max_score) {
        scoreConditions.push(
          { score_team1: { [Op.lte]: parseInt(max_score) } },
          { score_team2: { [Op.lte]: parseInt(max_score) } }
        );
      }
      if (scoreConditions.length > 0) {
        whereConditions[Op.or] = scoreConditions;
      }
    }

    const { count, rows: games } = await Game.findAndCountAll({
      where: whereConditions,
      include: [
        { model: Team, as: 'team1', attributes: ['id', 'name', 'city'] },
        { model: Team, as: 'team2', attributes: ['id', 'name', 'city'] }
      ],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: limitNum,
      offset: offset
    });

    const totalPages = Math.ceil(count / limitNum);

    res.status(200).json({
      success: true,
      data: games,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: count,
        items_per_page: limitNum,
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch games');
  }
}

// GET /api/games/:id - Отримати гру за ID
async function getGameByIdAPI(req, res) {
  try {
    const { id } = req.params;
    
    const game = await Game.findByPk(id, {
      include: [
        { model: Team, as: 'team1', attributes: ['id', 'name', 'city'] },
        { model: Team, as: 'team2', attributes: ['id', 'name', 'city'] }
      ]
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.status(200).json({
      success: true,
      data: game
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch game');
  }
}

// POST /api/games - Створити нову гру
async function createGameAPI(req, res) {
  const transaction = await sequelize.transaction();
  
  try {
    const { game_date, team1_id, team2_id, score_team1, score_team2 } = req.body;

    // Валідація
    if (!game_date || !team1_id || !team2_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: game_date, team1_id, team2_id'
      });
    }

    if (team1_id === team2_id) {
      return res.status(400).json({
        success: false,
        message: 'Team cannot play against itself'
      });
    }

    // Перевіряємо існування команд
    const team1 = await Team.findByPk(team1_id, { transaction });
    const team2 = await Team.findByPk(team2_id, { transaction });
    
    if (!team1 || !team2) {
      return res.status(404).json({
        success: false,
        message: 'One or both teams do not exist'
      });
    }

    const game = await Game.create({
      game_date: new Date(game_date),
      team1_id: parseInt(team1_id),
      team2_id: parseInt(team2_id),
      score_team1: parseInt(score_team1) || 0,
      score_team2: parseInt(score_team2) || 0
    }, { transaction });

    await transaction.commit();

    // Отримуємо створену гру з повною інформацією
    const createdGame = await Game.findByPk(game.id, {
      include: [
        { model: Team, as: 'team1', attributes: ['id', 'name', 'city'] },
        { model: Team, as: 'team2', attributes: ['id', 'name', 'city'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: createdGame
    });
  } catch (error) {
    await transaction.rollback();
    handleError(res, error, 'Failed to create game');
  }
}

// PUT /api/games/:id - Оновити гру
async function updateGameAPI(req, res) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { game_date, team1_id, team2_id, score_team1, score_team2 } = req.body;

    const game = await Game.findByPk(id, { transaction });
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Валідація
    if (team1_id === team2_id) {
      return res.status(400).json({
        success: false,
        message: 'Team cannot play against itself'
      });
    }

    // Перевіряємо команди, якщо вони оновлюються
    if (team1_id || team2_id) {
      const team1 = await Team.findByPk(team1_id || game.team1_id, { transaction });
      const team2 = await Team.findByPk(team2_id || game.team2_id, { transaction });
      
      if (!team1 || !team2) {
        return res.status(404).json({
          success: false,
          message: 'One or both teams do not exist'
        });
      }
    }

    await game.update({
      game_date: game_date ? new Date(game_date) : game.game_date,
      team1_id: team1_id ? parseInt(team1_id) : game.team1_id,
      team2_id: team2_id ? parseInt(team2_id) : game.team2_id,
      score_team1: score_team1 !== undefined ? parseInt(score_team1) : game.score_team1,
      score_team2: score_team2 !== undefined ? parseInt(score_team2) : game.score_team2
    }, { transaction });

    await transaction.commit();

    // Отримуємо оновлену гру
    const updatedGame = await Game.findByPk(id, {
      include: [
        { model: Team, as: 'team1', attributes: ['id', 'name', 'city'] },
        { model: Team, as: 'team2', attributes: ['id', 'name', 'city'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Game updated successfully',
      data: updatedGame
    });
  } catch (error) {
    await transaction.rollback();
    handleError(res, error, 'Failed to update game');
  }
}

// DELETE /api/games/:id - Видалити гру
async function deleteGameAPI(req, res) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const game = await Game.findByPk(id, { transaction });
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    await game.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    handleError(res, error, 'Failed to delete game');
  }
}

// GET /api/teams - Отримати всі команди з фільтрацією та пагінацією
async function getAllTeamsAPI(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      city,
      founded_year_from,
      founded_year_to,
      sort_by = 'name',
      sort_order = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Побудова умов фільтрації
    const whereConditions = {};
    
    if (name) {
      whereConditions.name = { [Op.iLike]: `%${name}%` };
    }
    
    if (city) {
      whereConditions.city = { [Op.iLike]: `%${city}%` };
    }
    
    if (founded_year_from || founded_year_to) {
      whereConditions.founded_year = {};
      if (founded_year_from) whereConditions.founded_year[Op.gte] = parseInt(founded_year_from);
      if (founded_year_to) whereConditions.founded_year[Op.lte] = parseInt(founded_year_to);
    }

    const { count, rows: teams } = await Team.findAndCountAll({
      where: whereConditions,
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: limitNum,
      offset: offset
    });

    const totalPages = Math.ceil(count / limitNum);

    res.status(200).json({
      success: true,
      data: teams,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: count,
        items_per_page: limitNum,
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch teams');
  }
}

// GET /api/teams/:id - Отримати команду за ID
async function getTeamByIdAPI(req, res) {
  try {
    const { id } = req.params;
    
    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch team');
  }
}

// POST /api/teams - Створити нову команду
async function createTeamAPI(req, res) {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, city, founded_year } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    // Перевіряємо унікальність назви
    const existingTeam = await Team.findOne({
      where: { name: name.trim() },
      transaction
    });
    
    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: 'Team with this name already exists'
      });
    }

    const team = await Team.create({
      name: name.trim(),
      city: city ? city.trim() : null,
      founded_year: founded_year ? parseInt(founded_year) : null
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    await transaction.rollback();
    handleError(res, error, 'Failed to create team');
  }
}

// PUT /api/teams/:id - Оновити команду
async function updateTeamAPI(req, res) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { name, city, founded_year } = req.body;

    const team = await Team.findByPk(id, { transaction });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Перевіряємо унікальність назви, якщо вона оновлюється
    if (name && name.trim() !== team.name) {
      const existingTeam = await Team.findOne({
        where: { 
          name: name.trim(),
          id: { [Op.ne]: id }
        },
        transaction
      });
      
      if (existingTeam) {
        return res.status(409).json({
          success: false,
          message: 'Team with this name already exists'
        });
      }
    }

    await team.update({
      name: name ? name.trim() : team.name,
      city: city !== undefined ? (city ? city.trim() : null) : team.city,
      founded_year: founded_year !== undefined ? (founded_year ? parseInt(founded_year) : null) : team.founded_year
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    await transaction.rollback();
    handleError(res, error, 'Failed to update team');
  }
}

// DELETE /api/teams/:id - Видалити команду
async function deleteTeamAPI(req, res) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const team = await Team.findByPk(id, { transaction });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Перевіряємо, чи немає пов'язаних ігор
    const gamesCount = await Game.count({
      where: {
        [Op.or]: [
          { team1_id: id },
          { team2_id: id }
        ]
      },
      transaction
    });

    if (gamesCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete team. It has ${gamesCount} associated games.`
      });
    }

    await team.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    handleError(res, error, 'Failed to delete team');
  }
}


module.exports = {
  getAllGamesAPI,
  getGameByIdAPI,
  createGameAPI,
  updateGameAPI,
  deleteGameAPI,

  getAllTeamsAPI,
  getTeamByIdAPI,
  createTeamAPI,
  updateTeamAPI,
  deleteTeamAPI,
};