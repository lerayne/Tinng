window.onload = function(){
	startInterface();
	startEngine();
	removeCurtain();
}

window.onbeforeunload = function(){
	//alert('exiting program!');
	
	// AJAX: // закрываем сессию на сервере
	JsHttpRequest.query( 'ajax_backend.php', {
		
		action: 'close_session' 
	
	}, function(){}, false );
	
	wait.stop();
	
}
