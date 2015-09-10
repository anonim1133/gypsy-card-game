var db = require('./db');

module.exports.create = function(name, owner, players, ret) {
	if(owner !== undefined){		
		if(name == undefined)
			name = 'Cheater ' + new Date().toUTCString();
			
			db.newGame(name, owner, players, function(id){
				ret(id);
			});
	}else{
		return false;
	}
	
	return true;
}

module.exports.getList = function(limit, ret){
	db.getGames(limit, function(rows){
		ret(rows);
	});
}

module.exports.getGame = function(id, ret){
	db.getGame(id, function(info){
		ret(info);
	});
}

module.exports.getGameCards = function(gid, ret){
	db.getGameCards(gid, function(cards){
		ret(cards);
	});
}

module.exports.join = function(game, player){
		db.joinGame(game, player);
	
	return true;
}

module.exports.getHand = function(gid, pid, ret){
	db.getHand(gid, pid, function(cards){
		ret(cards);
	});
}

module.exports.start = function(game, player){
	db.getPlayers(game, function(players){
		if(players.length > 1){//ToDo: check max players
			for(var j, x, i = players.length; i; j = Math.floor(Math.random() * i), x = players[--i], players[i] = players[j], players[j] = x);
			db.removeHandCards(game);
			handOutCards(game, players);
			putFirstCard(game);
			db.startGame(game, player, players);
		}
	});
	
	
	return true;
}

module.exports.playCard = function(gid, pid, cid, ret){
	db.getTurn(gid, function(turn){
		if(turn.id == pid)
			db.putCardOnStack(gid, pid, cid, function(cards){
				shiftTurn(gid);
				ret('Played card');
			});
		else
			ret('832');//Wrong turn
	});
}

module.exports.getTurn = function(gid, ret){
	db.getTurn(gid, function(turn){
		ret(turn);
	});
}

module.exports.check = function(gid, ret){
	db.checkCards(gid, function(rows){
		if(rows.length === 2){
			var first = rows[0].card.split(' ');
			var last = rows[1].card.split(' ');
			
			if(first[0] == last[0] || first[1] == last[1]){
				ret('true');
			}else{
				//ret('false');
				db.getGameCards(gid, function(cards){
					
					var players_cards = [];
					
					cards.forEach(function(card){
						players_cards.push({
							gid: gid, 
							pid: rows[1].id_player, 
							name: card.card
						});
					});
					
					var last_card = players_cards.pop();
					
					console.log(players_cards.length);
					if(players_cards.length > 0){
						db.clearTable(gid);
						db.saveCards(players_cards);//To players hand
						db.putCard(gid, last_card.pid, last_card.name);// new first card
					}
					
					ret(players_cards);
				});
			}
		}
	});
}




function handOutCards(game, players){
	//build deck
	var cards = [];
	var colors = ['clubs', 'diamonds', 'hearts', 'spades'];
	var shapes = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'K', 'Q'];
	
	colors.forEach(function(color){
		shapes.forEach(function(shape){
			cards.push(color + ' _' + shape);
		});
	});

	//handout cards
	var players_cards = [];
	
	var cards_count = cards.length;
	for(var i = 0; i < cards_count; i++){
		var ri = Math.floor(Math.random() * cards.length);
		
		var card = cards.splice(ri, 1);
		var player = players.shift();
		players.push(player);

		players_cards.push({
			gid: game, 
			pid: player, 
			name: card[0]
		});
	}

	db.saveCards(players_cards);
}

function putFirstCard(gid){
	var colors = ['clubs', 'diamonds', 'hearts', 'spades'];
	var shapes = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'K', 'Q'];
	
	var card = colors[Math.floor(Math.random() * colors.length)] + ' _' + shapes[Math.floor(Math.random() * shapes.length)];
	
	db.putCard(gid, 0, card);
}

function shiftTurn(gid){
		db.getTurnPlayers(gid, function(players){
			var player = players.shift();
			players.push(player);
			db.saveTurn(gid, players);
		});
}

//game end: delete cards on table/in hand
//game end: assign points to players
