window.onload = function(){
	startInterface();
	startEngine();
	removeCurtain();
}

window.onbeforeunload = function(){
	//alert('exiting program!');
	
	// AJAX: // закрываем сессию на сервере
	JsHttpRequest.query( 'backend/service.php', {
		
		action: 'close_session' 
	
	}, function(){}, false );
	
	wait.stop();
	
}
