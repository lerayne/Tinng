tinng.funcs.onWindowLoad = function(){
	var t = this.tinng;

	// создание машин, использующих селекторы
	t.chunks = new t.protos.ChunksEngine('tinng-chunks', 'data-chunk-name');
	t.ui = new t.protos.UserInterface(window);

	t.rotor = new t.protos.Rotor(
		'/backend/update.php',
		t.sync,
		t.funcs.parser
	);

	// загрузка данных из хеша
	t.sync.curTopic = parseInt(t.address.get('topic'));
	t.sync.plimit = parseInt(t.address.get('plimit')) || t.sync.plimit;

	// запуск соединения с сервером
	t.rotor.start('load_pages');
}

tinng.funcs.onWindowLoad.prototype.tinng = tinng;

$(window).on('load', tinng.funcs.onWindowLoad)

/*window.onbeforeunload = function(){
	//alert('exiting program!');
	
	// AJAX: // закрываем сессию на сервере
	JsHttpRequest.query( 'backend/service.php', {
		
		action: 'close_session' 
	
	}, function(){}, false );
	
	rotor.stop();
	
}*/
