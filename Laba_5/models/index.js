const { Sequelize, DataTypes } = require('sequelize');

// Конфігурація підключення до бази даних
const sequelize = new Sequelize('SportsDB', 'sa', '123456789', {
  host: 'DESKTOP-63T21CU',
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  },
  logging: console.log
});

// Модель Teams
const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  founded_year: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'Teams',
  timestamps: false
});

// Модель Games
const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  game_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  team1_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Team,
      key: 'id'
    }
  },
  team2_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Team,
      key: 'id'
    }
  },
  score_team1: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  score_team2: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'Games',
  timestamps: false
});

// Зв'язки між моделями (один-до-багатьох)
Team.hasMany(Game, { foreignKey: 'team1_id', as: 'homeGames' });
Team.hasMany(Game, { foreignKey: 'team2_id', as: 'awayGames' });
Game.belongsTo(Team, { foreignKey: 'team1_id', as: 'team1' });
Game.belongsTo(Team, { foreignKey: 'team2_id', as: 'team2' });

// Функція ініціалізації бази даних
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to database established successfully.');
    
    // Синхронізація моделей з базою даних
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
    
    // Створення початкових команд, якщо їх немає
    const teamCount = await Team.count();
    if (teamCount === 0) {
      await Team.bulkCreate([
        { name: 'FC Barcelona', city: 'Barcelona', founded_year: 1899 },
        { name: 'Real Madrid', city: 'Madrid', founded_year: 1902 },
        { name: 'Manchester United', city: 'Manchester', founded_year: 1878 },
        { name: 'Liverpool FC', city: 'Liverpool', founded_year: 1892 }
      ]);
      console.log('Initial teams created.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = {
  sequelize,
  Team,
  Game,
  initializeDatabase
};