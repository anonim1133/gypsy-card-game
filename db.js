var pg = require('pg');

module.exports.query = function(query){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		client.query('SELECT $1::int AS number', ['1'], function(err, result) {
		
		done();
		
		if (err) {
			return console.error('error running query', err);
		}
		
		return result;
		});

	});
}

module.exports.newPlayer = function(id, name){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		client.query('INSERT INTO player values ($1, $2, 0)', [id, name], function(err, result) {	
			done();
			
			if (err) {
				if(err.code === '23505') console.log('User with that ID already exists')
				else console.error('error running query', err);
			}
		});

	});
}

module.exports.newGame = function(name, owner, players, ret){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		client.query('INSERT INTO game(name, id_owner, players, turn, active) values ($1, $2, $3, 0, false) RETURNING id', [name, owner, players], function(err, result) {	
			done();
			
			if (err) {
				console.error('error running query', err);
			}else{
				ret(result.rows[0].id);
			}
		});

	});
}

module.exports.getGames = function(limit, ret){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		var query = client.query('SELECT * FROM game LIMIT $1', [limit], function(err, result) {	
			done();
			
			if (err)
				return console.error('error running query', err);
			else
				ret(result.rows);
		});
	});
}

module.exports.getGame = function(id, ret){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		var query = client.query('SELECT * FROM (	SELECT game.id as game_id, game.name as game_name, game.players as max_players, owner.id as owner_id,	owner.name as owner_name, turn.id as turn_id, turn.name as turn_name, active, timestamp FROM game JOIN player owner ON owner.id= game.id_owner LEFT JOIN player turn  ON turn.id = game.turn WHERE game.id = $1	UNION SELECT game_player.game, game_player.player, NULL, NULL, name, NULL, NULL, NULL, NULL FROM game_player JOIN player ON player.id = game_player.player WHERE game = $1) alias ORDER BY max_players ASC', [id], function(err, result) {	
			done();
			
			if (err)
				return console.error('error running query', err);
			else
				ret(result.rows);
		});
	});
}

module.exports.joinGame = function(game, player){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		client.query('INSERT INTO game_player(game, player) values ($1, $2)', [game, player], function(err, result) {	
			done();
			
			if (err) {
				console.error('error running query', err);
			}
		});

	});
}
