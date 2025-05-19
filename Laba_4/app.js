const express = require('express');
const path = require('path');
const app = express();
const gamesRouter = require('./routes/games');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', gamesRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log('Server is running on http://localhost:' + PORT);
});
