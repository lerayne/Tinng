window.onload = function(){

	startInterface();
	startEngine();
	revealInterface();

}

window.onbeforeunload = function(){
	//alert('exiting program!');
	
	// AJAX: // закрываем сессию на сервере
	JsHttpRequest.query( 'backend/service.php', {
		
		action: 'close_session' 
	
	}, function(){}, false );
	
	rotor.stop();
	
}