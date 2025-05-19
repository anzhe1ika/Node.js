CREATE TABLE Teams (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL
);

CREATE TABLE Games (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_date DATE NOT NULL,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    score_team1 INT NULL,
    score_team2 INT NULL,
    FOREIGN KEY (team1_id) REFERENCES Teams(id),
    FOREIGN KEY (team2_id) REFERENCES Teams(id)
);
