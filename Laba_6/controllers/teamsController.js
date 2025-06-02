const { sequelize, Team, Game } = require('../models');

async function getAllTeams(req, res) {
  try {
    let { name, page, limit } = req.query;

    if (name !== undefined && name.trim() === '') {
      return res.redirect('/teams');
    }

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 5;
    const offset = (page - 1) * limit;

    const where = {};
    if (name && name.trim() !== '') {
      where.name = { [sequelize.Sequelize.Op.like]: `%${name.trim()}%` };
    }

    const { count, rows: teams } = await Team.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset
    });

    const pageCount = Math.ceil(count / limit);

    res.render('teams', { 
      teams, 
      filterName: name || '', 
      currentPage: page,
      pageCount
    });
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).send('Database error: ' + err.message);
  }
}


// CREATE - Додати нову команду
async function addTeam(req, res) {
  const { name, city, founded_year } = req.body;
  const transaction = await sequelize.transaction();
  
  try {
    // Перевіряємо унікальність назви команди
    const existingTeam = await Team.findOne({
      where: { name: name.trim() },
      transaction
    });
    
    if (existingTeam) {
      throw new Error('Team with this name already exists');
    }

    await Team.create({
      name: name.trim(),
      city: city ? city.trim() : null,
      founded_year: founded_year ? parseInt(founded_year) : null
    }, { transaction });

    await transaction.commit();
    res.redirect('/teams');
  } catch (err) {
    await transaction.rollback();
    console.error('Error adding team:', err);
    res.status(500).send('Insert error: ' + err.message);
  }
}

// READ - Отримати команду для редагування
async function getTeamForEdit(req, res) {
  const { id } = req.params;
  
  try {
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).send('Team not found');
    }

    res.render('editTeam', { team });
  } catch (err) {
    console.error('Error fetching team:', err);
    res.status(500).send('Database error: ' + err.message);
  }
}

// UPDATE - Оновити команду
async function updateTeam(req, res) {
  const { id } = req.params;
  const { name, city, founded_year } = req.body;
  const transaction = await sequelize.transaction();
  
  try {
    const team = await Team.findByPk(id, { transaction });
    if (!team) {
      throw new Error('Team not found');
    }

    // Перевіряємо унікальність назви
    const existingTeam = await Team.findOne({
      where: { 
        name: name.trim(),
        id: { [sequelize.Sequelize.Op.ne]: id }
      },
      transaction
    });
    
    if (existingTeam) {
      throw new Error('Team with this name already exists');
    }

    await team.update({
      name: name.trim(),
      city: city ? city.trim() : null,
      founded_year: founded_year ? parseInt(founded_year) : null
    }, { transaction });

    await transaction.commit();
    res.redirect('/teams');
  } catch (err) {
    await transaction.rollback();
    console.error('Error updating team:', err);
    res.status(500).send('Update error: ' + err.message);
  }
}

// DELETE - Видалити команду
async function deleteTeam(req, res) {
  const { id } = req.params;
  const transaction = await sequelize.transaction();
  
  try {
    const team = await Team.findByPk(id, { transaction });
    if (!team) {
      throw new Error('Team not found');
    }

    // Перевіряємо, чи немає ігор з цією командою
    const gamesCount = await Game.count({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { team1_id: id },
          { team2_id: id }
        ]
      },
      transaction
    });

    if (gamesCount > 0) {
      throw new Error(`Cannot delete team. It has ${gamesCount} associated games.`);
    }

    await team.destroy({ transaction });
    await transaction.commit();
    res.redirect('/teams');
  } catch (err) {
    await transaction.rollback();
    console.error('Error deleting team:', err);
    res.status(500).send('Delete error: ' + err.message);
  }
}

module.exports = {
  getAllTeams,
  addTeam,
  getTeamForEdit,
  updateTeam,
  deleteTeam
};