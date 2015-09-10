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
		
		client.query('INSERT INTO game(name, id_owner, players, turn, active) values ($1, $2, $3, null, false) RETURNING id', [name, owner, players], function(err, result) {	
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
		var query = client.query('SELECT * FROM (	SELECT game.id as game_id, game.name as game_name, game.players as max_players, owner.id as owner_id, owner.name as owner_name, game.turn, turn.id as turn_id, turn.name as turn_name, active, timestamp FROM game JOIN player owner ON owner.id= game.id_owner LEFT JOIN player turn  ON turn.id = game.turn[1] WHERE game.id = $1	UNION SELECT game_player.game, game_player.player, NULL, NULL, name, NULL, NULL, NULL, NULL, NULL FROM game_player JOIN player ON player.id = game_player.player WHERE game = $1) alias ORDER BY max_players ASC', [id], function(err, result) {	
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

module.exports.getPlayers = function(game, ret_players){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		var players = []
		client.query('SELECT * FROM game_player WHERE game = $1', [game], function(err, result) {
			done();
			
			if (err) {
				console.error('error running query', err);
			}else{
				result.rows.forEach(function(row){
					players.push(row.player);
				});
				
				ret_players(players);
			}
		});
		
		
	});
}

module.exports.getTurnPlayers = function(game, ret_players){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		var players = []
		client.query('SELECT unnest(turn) as player FROM game WHERE id = $1', [game], function(err, result) {
			done();
			
			if (err) {
				console.error('error running query', err);
			}else{
				var players = [];
				result.rows.forEach(function(row){
					players.push(row.player);
				});
				
				ret_players(players);
			}
		});
		
		
	});
}

module.exports.startGame = function(game, player, players){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done){
		if (err) {
			return console.error('error fetching client from pool', err);
		}


		client.query('UPDATE game SET turn = $3, active = true WHERE id = $1 AND id_owner = $2', [game, player, players], function(err, result){
			done();

			if (err) {
				console.error('error running query', err);
			}
		});
	});
}

module.exports.removeHandCards = function(gid){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done){
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		client.query('DELETE FROM hand WHERE id_game=$1', [gid], function(err, result){
			done();

			if (err) {
				console.error('error running query', err);
			}

		});
	});
}
module.exports.saveCards = function(cards){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done){
		if(err){
			return console.error('error fetching client from pool', err);
		}			
		cards.forEach(function(card){
			client.query('INSERT INTO hand(id_game, id_player, card) values ($1, $2, $3)', [card.gid, card.pid, card.name], function(err, result){
				done();

				if (err) {
					console.error('error running query', err);
				}				
			});
		});
	});
}


module.exports.putCard = function(gid, pid, card){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done){
		if (err) {
			return console.error('error fetching client from pool', err);
		}

		if(pid == 0){
			client.query('INSERT INTO cards_table(id_game, id_player, card) VALUES ($1, (SELECT id_owner FROM game where id = $1), $2)', [gid, card], function(err, result){
				done();

				if (err) {
					console.error('error running query', err);
				}
			});

		}else{		
			client.query('INSERT INTO cards_table(id_game, id_player, card) VALUES ($1, $2, $3)', [gid, pid, card], function(err, result){
				done();

				if (err) {
					console.error('error running query', err);
				}
			});
		}
	});
			
}

module.exports.getGameCards = function(gid, ret){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		var query = client.query('SELECT * FROM cards_table WHERE id_game = $1 order BY date ASC', [gid], function(err, result) {	
			done();

			if (err)
				return console.error('error running query', err);
			else
				ret(result.rows);
		});
	});
}

module.exports.getHand = function(gid, pid, ret){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		var query = client.query('SELECT * FROM hand WHERE id_game= $1 AND id_player = $2 order by card', [gid, pid], function(err, result) {	
			done();

			if (err)
				return console.error('error running query', err);
			else
				ret(result.rows);
		});
	});
}

module.exports.putCardOnStack = function(gid, pid, cid, ret){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		var query = client.query('INSERT INTO cards_table(id_game, id_player, card) VALUES ($1, $2, (SELECT card FROM hand WHERE id_game= $1 AND id_player = $2 AND id = $3 ))', [gid, pid, cid], function(err, result) {
					done();

					if (err)
						return console.error('error running query', err);
					else{
						ret(result.rows);
						
						client.query('DELETE FROM hand WHERE id_game=$1 AND id_player=$2 AND id=$3', [gid, pid, cid], function(err, result){
							done();

							if (err) {
								console.error('error running query', err);
							}
						});
					}
		});
	});
};

module.exports.saveTurn = function(gid, players){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		client.query('UPDATE game SET turn = $2 WHERE id = $1', [gid, players], function(err, result) {	
			done();
			
			if (err) {
				console.error('error saving turn', err);
			}
		});

	});
}

module.exports.getTurn = function(gid, ret){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		client.query('SELECT turn[1] as id, player.name as name FROM game JOIN player on turn[1] = player.id WHERE game.id = $1', [gid], function(err, result) {	
			done();
			
			if (err) {
				console.error('error getting turn', err);
			}else{
				ret(result.rows[0]);
			}
		});

	});
}


module.exports.checkCards = function(gid, ret){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		client.query('SELECT id_player, card FROM (SELECT row_number() over (order by date asc) as rn, count(*) over() as top, id_player, card FROM cards_table where id_game = $1) sub WHERE sub.rn = 1 OR sub.rn = sub.top', [gid], function(err, result) {	
			done();
			
			if (err) {
				console.error('error getting cards to check', err);
			}else{
				ret(result.rows);
			}
		});

	});
}

module.exports.clearTable = function(gid){
	pg.connect(global.config.PG_CONNECTION_STRING, function(err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		
		client.query('DELETE FROM cards_table WHERE id_game = $1', [gid], function(err, result) {	
			done();
			
			if (err) {
				console.error('error clearing table', err);
			}
		});

	});
}
