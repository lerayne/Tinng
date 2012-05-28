window.onload = function(){
	var t = tinng;

	t.chunks = new t.protos.ChunksEngine('tinng-chunks', 'data-chunk-name');
	t.ui = new t.protos.UserInterface(window);

	t.rotor = new t.protos.Rotor(
		'/backend/update.php',
		t.sync,
		t.funcs.parser
	);

	t.rotor.start('load_pages');
	/*
	startInterface();
	startEngine();
	revealInterface();
	*/
}

/*window.onbeforeunload = function(){
	//alert('exiting program!');
	
	// AJAX: // закрываем сессию на сервере
	JsHttpRequest.query( 'backend/service.php', {
		
		action: 'close_session' 
	
	}, function(){}, false );
	
	rotor.stop();
	
}*/
