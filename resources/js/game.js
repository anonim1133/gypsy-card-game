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
