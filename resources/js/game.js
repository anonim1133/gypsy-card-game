function joinGame(gid, uid){
    $.get( "/joinGame/" + gid + "/" + uid, function( data ) {
		console.log(gid);
        console.log(data);
    }).fail(function(){
        console.log('Error while joining game');
    });
}
