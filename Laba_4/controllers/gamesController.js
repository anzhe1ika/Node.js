




const { sql, config } = require('../db/connection');

async function getAllGames(req, res) {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT g.id, g.game_date, 
             t1.name AS team1, 
             t2.name AS team2, 
             g.score_team1, g.score_team2
      FROM Games g
      JOIN Teams t1 ON g.team1_id = t1.id
      JOIN Teams t2 ON g.team2_id = t2.id
    `);
    res.render('index', { games: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error: ' + err.message);
  }
}

async function addGame(req, res) {
  const { game_date, team1_id, team2_id, score1, score2 } = req.body;

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('game_date', sql.Date, game_date)
      .input('team1_id', sql.Int, team1_id)
      .input('team2_id', sql.Int, team2_id)
      .input('score_team1', sql.Int, score1)
      .input('score_team2', sql.Int, score2)
      .query(`
        INSERT INTO Games (game_date, team1_id, team2_id, score_team1, score_team2)
        VALUES (@game_date, @team1_id, @team2_id, @score_team1, @score_team2)
      `);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Insert error: ' + err.message);
  }
}

async function deleteGame(req, res) {
  const { id } = req.params;
  try {
    const pool = await sql.connect(config);
    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM Games WHERE id = @id');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Delete error: ' + err.message);
  }
}

module.exports = {
  getAllGames,
  addGame,
  deleteGame
};
