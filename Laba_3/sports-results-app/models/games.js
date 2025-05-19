const fs = require('fs');
const fsp = require('fs/promises');

const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FILE_PATH = path.join(__dirname, '..', 'data', 'games.json');

// 1. getAllGames - Promise
function getAllGames() {
  return fsp.readFile(FILE_PATH, 'utf-8')
    .then(data => JSON.parse(data))
    .catch(err => Promise.reject(err));
}

// 2. addNewGame - Callback
function addNewGame(newGame, callback) {
  getAllGames()
    .then(games => {
      newGame.id = uuidv4(); // Генерація унікального ID
      games.push(newGame);
      fs.writeFile(FILE_PATH, JSON.stringify(games, null, 2), 'utf-8', (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    })
    .catch(callback);
}

// 3. getGamesByQuery - Async/Await
async function getGamesByQuery(query) {
  const games = await fsp.readFile(FILE_PATH, 'utf-8');
  const parsedGames = JSON.parse(games);
  return parsedGames.filter(game =>
    game.teamA.toLowerCase().includes(query.toLowerCase()) ||
    game.teamB.toLowerCase().includes(query.toLowerCase())
  );
}

// 4. deleteGameById - Sync
function deleteGameById(gameId) {
  const games = fs.readFileSync(FILE_PATH, 'utf-8');
  const parsedGames = JSON.parse(games);
  const filteredGames = parsedGames.filter(game => game.id !== gameId);
  fs.writeFileSync(FILE_PATH, JSON.stringify(filteredGames, null, 2), 'utf-8');
}

module.exports = {
  getAllGames,
  addNewGame,
  getGamesByQuery,
  deleteGameById
};

