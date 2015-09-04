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

module.exports.join = function(game, player) {
		db.joinGame(game, player);
	
	return true;
}

//game end: delete cards on table/in hand
//game end: assign points to players
