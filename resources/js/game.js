function joinGame(gid, uid){
    $.get( "/joinGame/" + gid + "/" + uid, function( data ) {
		var list = $('#player_list');
		var new_player = $('<li>').attr('id', data.uid).text(data.uname);

		var found = false;
		$('#player_list li').each(function(key, li){

			if($(li).attr('id') == data.uid) found = true;
		});


		if(!found) list.append(new_player);
		
    }).fail(function(){
        console.log('Error while joining game');
    });
}

function startGame(gid){
	//ToDo: Check if theres more than 1 player
	//ToDo: Check if players limit isnt reached
	$.get( "/startGame/" + gid + "/", function( data ) {
		$('a#start').remove();
    }).fail(function(){
        console.log('Error while starting game');
    });	
}

function pushCardOnStack(card){
	$('ul#cardsStack').append($('<li class="card" style="top: '+Math.floor((Math.random() * 512) - 256 + 134)+'px; left: '+Math.floor((Math.random() * 512) - 256)+'px; transform:rotate('+Math.floor((Math.random() * 64) + 1 - 32)+'deg);">'));
}

function pushCardOnHand(card){
	var hand = $('ul#cardsHand');
	hand.append($('<li id='+ card.id +' onClick="putCard(this);" class="cardHand ' + card.card + '">'));
}

function getHand(li){
	var url = window.location.href.split('/');
	var gid = url[url.length-1];
	
	if(url[url.length-2] == 'game'){
		$.get( "/getHand/" + gid + "/", function( data ) {
			data.forEach(function(card){
				pushCardOnHand(card);
			});
		}).fail(function(){
			console.log('Error while getting hand');
		});	
	}
}

function putCard(card){
	var url = window.location.href.split('/');
	var gid = url[url.length-1].split('#')[0];
	var cid = $(card).attr('id');
	
	$.get( "/playCard/" + gid + "/" + cid, function( data ) {
		if(data !== '832'){
			pushCardOnStack('');
			card.remove();
			$('a#check').hide();
		}
    }).fail(function(){
        console.log('Error while putting card');
    });	
}

function refreshTurn(){
	var url = window.location.href.split('/');
	var gid = url[url.length-1].split('#')[0];
	
	$.get( "/getTurn/" + gid, function( data ) {
		if(data.name !== undefined){
			$('#turn_name span').text(data.name);
			
			if(data.self == true)
				$('a#check').show();
			else
				$('a#check').hide();
		}
    }).fail(function(){
        console.log('Error while refreshing turn');
    });
    
    setTimeout(refreshTurn, 1024);
}

function check(){
	var url = window.location.href.split('/');
	var gid = url[url.length-1].split('#')[0];
	$.get( "/check/" + gid, function( data ) {
		console.log(data);
    }).fail(function(){
        console.log('Error while checking game');
    });	
}



$( document ).ready(function(){
	$('ul#cardsHand ').empty();
	getHand();
	
	refreshTurn();
});
