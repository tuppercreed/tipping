BEGIN;

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE tournament_round (
    round_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
    round_number INTEGER,
    round_name TEXT NOT NULL,
    PRIMARY KEY(round_year, round_number)
);

CREATE TABLE team (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    team_name TEXT NOT NULL,
    abbreviation TEXT,
    standing JSONB,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (team_name)
);

CREATE TABLE game (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    venue TEXT NOT NULL,
    scheduled TIMESTAMP(3),
    round_year INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    complete BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (round_year, round_number) REFERENCES tournament_round (round_year, round_number) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE game_team (
    game_id INTEGER NOT NULL REFERENCES game ON DELETE RESTRICT ON UPDATE CASCADE,
    team_id INTEGER NOT NULL REFERENCES team ON DELETE RESTRICT ON UPDATE CASCADE,
    home BOOLEAN NOT NULL,
    winner BOOLEAN,
    goals INTEGER DEFAULT 0,
    behinds INTEGER DEFAULT 0,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id, team_id),
    UNIQUE (game_id, home)

);

CREATE TRIGGER set_timestamp_team
BEFORE UPDATE ON team
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_game
BEFORE UPDATE ON game
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_game_team
BEFORE UPDATE ON game_team
FOR EACH ROW 
EXECUTE FUNCTION trigger_set_timestamp();

CREATE FUNCTION game_started(scheduled TIMESTAMP(3))
RETURNS BOOLEAN
AS
$$
    SELECT (CURRENT_TIMESTAMP > scheduled)
$$
LANGUAGE SQL;

CREATE TABLE competition (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    competition_name TEXT NOT NULL,
    avatar_url TEXT,
    website TEXT,
    time_zone TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE person (
    id UUID REFERENCES auth.users PRIMARY KEY,
    username TEXT NOT NULL,
    avatar_url TEXT,
    website TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (username),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

CREATE TABLE tip (
    person_id UUID REFERENCES person ON DELETE RESTRICT ON UPDATE CASCADE,
    game_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    FOREIGN KEY (game_id, team_id) REFERENCES game_team (game_id, team_id) ON DELETE RESTRICT ON UPDATE CASCADE,

    PRIMARY KEY (person_id, game_id)
);

CREATE TABLE competitions_persons (
    competition_id INTEGER REFERENCES competition ON DELETE RESTRICT ON UPDATE CASCADE,
    person_id UUID REFERENCES person ON DELETE RESTRICT ON UPDATE CASCADE,
    PRIMARY KEY (competition_id, person_id)
);

CREATE TABLE predictor (
    id INTEGER PRIMARY KEY,
    predictor_name TEXT NOT NULL,
    predictor_url TEXT
);

CREATE TABLE prediction (
    game_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    predictor_id INTEGER REFERENCES predictor,
    win BOOLEAN,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    PRIMARY KEY (game_id, team_id, predictor_id),
    FOREIGN KEY (game_id, team_id) REFERENCES game_team (game_id, team_id)
);

CREATE TRIGGER set_timestamp_prediction
BEFORE UPDATE ON prediction
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Profile permissions
ALTER TABLE person ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON person FOR SELECT USING ( TRUE );
CREATE POLICY "Users can insert their own profile." ON person FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update their own profile." ON person FOR UPDATE WITH CHECK ( auth.uid() = id );

-- Profile photos
INSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars');
-- CREATE POLICY IF NOT EXISTS "Avatar images are public." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars');
-- CREATE POLICY IF NOT EXISTS "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars'); 

-- Competition permissions
ALTER TABLE competition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Competitions are public." ON competition FOR SELECT USING ( TRUE );
CREATE POLICY "Users can create a competition." ON competition FOR INSERT WITH CHECK ( auth.role() = 'authenticated');
CREATE POLICY "Members can update competition details." ON competition FOR UPDATE USING (
    auth.uid() in (
        SELECT person_id FROM competitions_persons WHERE competition_id = id
    )
);

-- Tipping
ALTER TABLE tip ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can add tips." ON tip FOR INSERT WITH CHECK (auth.uid() = person_id AND game_id in (
    SELECT id FROM game WHERE game_started(scheduled) IS NOT TRUE
));
CREATE POLICY "Anyone can can complete tips." ON tip FOR SELECT USING (game_id IN (
    SELECT game.id FROM game WHERE (game_started(game.scheduled) IS TRUE)
))
CREATE POLICY "Users can see tips." ON tip FOR SELECT USING (
    auth.uid() = person_id
);
CREATE POLICY "Users can update tips." ON tip FOR UPDATE USING (TRUE) WITH CHECK (auth.uid() = person_id AND game_id in (
    SELECT id FROM game WHERE game_started(scheduled) IS NOT TRUE
));
CREATE POLICY "Users can delete tips." ON tip FOR DELETE WITH CHECK (auth.uid() = person_id AND game_id in (
    SELECT id FROM game WHERE game_started(scheduled) IS NOT TRUE
));

CREATE VIEW team_game AS 
SELECT game.id game_id, team.id team_id
FROM game
INNER JOIN game_team ON game.id = game_team.game_id
INNER JOIN team ON game_team.team_id = team.id;


CREATE OR REPLACE FUNCTION calculate_score(side game_team) RETURNS INTEGER AS
$$
    SELECT side.goals * 6 + side.behinds AS score;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION calculate_winner(home game_team, away game_team) RETURNS INTEGER AS
$$
DECLARE
    home_score INTEGER := calculate_score(home);
    away_score INTEGER := calculate_score(away);
BEGIN
    IF home_score > away_score THEN
        RETURN home.team_id;
    ELSIF home_score < away_score THEN
        RETURN away.team_id;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION scores(r_year INTEGER, r_number INTEGER)
RETURNS TABLE(game_id INTEGER, winner_team_id INTEGER) AS $$
BEGIN
    RETURN QUERY SELECT game.id, calculate_winner(home.*, away.*)
    FROM game_team AS home
    INNER JOIN game_team AS away ON home.game_id = away.game_id
    INNER JOIN game ON home.game_id = game.id
    WHERE game.round_year = r_year AND game.round_number = r_number AND home.home AND NOT away.home;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION round_rankings(r_year INTEGER, r_number INTEGER)
RETURNS TABLE(round_year INTEGER, round_number INTEGER, person_id UUID, wins INTEGER) AS $$
    SELECT r_year, r_number, tip.person_id, COUNT(*) AS wins 
    FROM scores(r_year, r_number) AS score 
    INNER JOIN tip 
        ON score.game_id = tip.game_id 
        AND score.winner_team_id = tip.team_id 
    GROUP BY tip.person_id;
$$ LANGUAGE SQL;

CREATE TABLE competition_rankings_summary (
    round_year INTEGER,
    round_number INTEGER,
    person_id UUID REFERENCES person,
    wins INTEGER,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (round_year, round_number, person_id),
    FOREIGN KEY (round_year, round_number) REFERENCES tournament_round (round_year, round_number)
);

CREATE TRIGGER set_timestamp_rankings_summary
BEFORE UPDATE ON competition_rankings_summary
FOR EACH ROW 
EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE competition_rankings_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rankings are public." ON competition_rankings_summary FOR SELECT USING ( TRUE );

CREATE OR REPLACE PROCEDURE insert_summary_rankings(r_year INTEGER, r_number INTEGER) AS $$
    INSERT INTO competition_rankings_summary 
    SELECT * FROM round_rankings(r_year, r_number) 
    ON CONFLICT (round_year, round_number, person_id) DO UPDATE SET wins = EXCLUDED.wins;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION competition_rankings_round(comp_id INTEGER, r_year INTEGER, r_number INTEGER) 
RETURNS TABLE (person_id UUID, wins INTEGER) 
AS $$
    SELECT competition_rankings_summary.person_id, wins AS total_wins 
    FROM competition_rankings_summary
    INNER JOIN competitions_persons
    ON competition_rankings_summary.person_id = competitions_persons.person_id
    WHERE round_year = r_year
    AND round_number = r_number
    AND competition_id = comp_id
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION competition_rankings(comp_id INTEGER, r_year INTEGER) 
RETURNS TABLE (person_id UUID, wins INTEGER) 
AS $$
    SELECT competition_rankings_summary.person_id, SUM(wins) AS total_wins 
    FROM competition_rankings_summary
    INNER JOIN competitions_persons
    ON competition_rankings_summary.person_id = competitions_persons.person_id
    WHERE round_year = r_year
    AND competition_id = comp_id
    GROUP BY competition_rankings_summary.person_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION all_rankings(r_year INTEGER) 
RETURNS TABLE (username TEXT, wins INTEGER) 
AS $$
    SELECT username, SUM(wins) AS total_wins 
    FROM competition_rankings_summary
    INNER JOIN person
    ON competition_rankings_summary.person_id = person.id
    WHERE round_year = r_year
    GROUP BY username;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tip_results(comp_id INTEGER, r_year INTEGER, r_number INTEGER)
RETURNS TABLE (person_id UUID, game_id INTEGER, team_id INTEGER, correct BOOLEAN, drawn BOOLEAN, username TEXT)
AS $$
    SELECT tip.person_id, tip.game_id, tip.team_id, tipped.winner AS correct, 
        (calculate_score(tipped) = calculate_score(not_tipped)) AS drawn, 
        person.username, team.team_name
    FROM tip
    INNER JOIN person ON tip.person_id = person.id
    INNER JOIN competitions_persons ON person.id = competitions_persons.person_id
    INNER JOIN game_team tipped ON tip.game_id = tipped.game_id AND tip.team_id = tipped.team_id
    INNER JOIN game_team not_tipped ON tip.game_id = not_tipped.game_id AND tip.team_id <> not_tipped.team_id
    INNER JOIN game ON tip.game_id = game.id
    INNER JOIN team ON tip.team_id = team.id
    WHERE game.round_year = r_year AND game.round_number = r_number AND competitions_persons.competition_id = comp_id
    ORDER BY tip.person_id, tip.game_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION tip_tally(comp_id INTEGER, r_year INTEGER, r_number INTEGER)
RETURNS TABLE (person_id UUID, username TEXT, score INTEGER)
AS $$
    SELECT tip.person_id, person.username, COUNT(*) FILTER (WHERE game_team.winner)
    FROM tip
    INNER JOIN game_team ON tip.game_id = game_team.game_id AND tip.team_id = game_team.team_id
    INNER JOIN game ON tip.game_id = game.id
    INNER JOIN person ON tip.person_id = person.id
    WHERE game.round_year = r_year AND game.round_number <= r_number
    GROUP BY tip.person_id, person.username;
$$ LANGUAGE SQL;



CREATE VIEW rank_pages AS
    SELECT DISTINCT game.round_number, competitions_persons.competition_id
    FROM tip
    INNER JOIN game ON tip.game_id = game.id
    INNER JOIN competitions_persons ON tip.person_id = competitions_persons.person_id
    WHERE game.round_year = date_part('year', CURRENT_DATE);
COMMIT;

CREATE VIEW next_round AS
    SELECT round_number
    FROM game
    WHERE round_year = date_part('year', CURRENT_DATE)
    ORDER BY scheduled DESC
    LIMIT 1;