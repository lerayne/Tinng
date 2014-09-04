/**
 * Created by Michael on 04.09.14.
 */

var connectionCallback = function(result, actions){
	console.log('result', result)

	if (!!result.feed){

	}
}

// initialization part 1: Basic DOM loaded
$(function(){
	console.log('global DOM ready')

	t.state.windowFocused = document.hasFocus();

	t.connection = new t.protos.Connection({
		server: t.cfg.server_url,
		callback:connectionCallback,
		autostart: false
	});

	// поведение при активации и деактивации окна
	$(window).on('blur', function(){

		if (t.state.windowFocused) {
			t.state.windowFocused = false;
			t.connection.setMode('passive');
		}
	});
	$(window).on('focus', function(){

		if (!t.state.windowFocused) {
			t.state.windowFocused = true;
			t.connection.setMode('active');
		}
	});
})

// initialization part 2: Polymer finished it's work
$(window).on('polymer-ready', function(){
	console.log('Polymer is ready')

	t.connection.start();
})


