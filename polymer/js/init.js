/**
 * Created by Michael on 04.09.14.
 */

var connectionCallback = function(result, actions){

	if (!!result.feeds){
		for (var i = 0; i < result.feeds.length; i++) {
			var subscriber = result.feeds[i];

			for (var key in subscriber) {
				$(window).trigger(key+'-update', [subscriber[key]])
			}
		}
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


