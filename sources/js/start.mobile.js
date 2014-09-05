/**
 * Created by Michael on 23.08.14.
 * @include classes/common/*
 * @include classes/mobile/*
 * @include parser.js
 */

tinng.funcs.onWindowLoad = function(){

	//todo - check mobile compatibility
	t.state.windowFocused = document.hasFocus();

	t.user = new tinng.protos.User(importedUser);
	if (t.user.id == 1) t.cfg.maintenance = 0;

	// создание машин, использующих селекторы
	t.chunks = new t.protos.ChunksEngine('tinng-chunks', 'data-chunk-name', 'data-cell');

	//todo - check mobile compatibility
	//t.notifier = new t.protos.Notifier();

	t.address = new tinng.protos.Address(';', ':');
	//t.keyListener = new tinng.protos.KeyListener();

	if (t.cfg.maintenance) {
		t.address.del(['topic', 'plimit'])
	}

	t.connection = new t.protos.Connection({
		server: t.cfg.server_url,
		callback:t.funcs.parser2,
		autostart: false
	});

	t.connection.setMode(t.state.windowFocused ? 'active' : 'passive');

	t.ui = new t.protos.UserInterface(window);
	t.userWatcher = new t.protos.UserWatcher();
	t.stateService = new t.protos.StateService();

	// загрузка данных из хеша адресной строки
	var topicFromAddress = t.address.get('topic');
	var dialogueFromAddress = t.address.get('dialogue');
	t.sync.curTopic = topicFromAddress ? parseInt(t.address.get('topic')) : 0;

	//t.units.topics.startWaitIndication();


	// такая конструкция нужна для того, чтобы 0 воспринимался как значение
	var loadedLimit = t.address.get('plimit');
	t.sync.plimit = (loadedLimit === false) ? t.sync.plimit : parseInt(loadedLimit);

	var initialSubscriptions = [];

	var curTopic = t.sync.curTopic;

	if (curTopic || dialogueFromAddress) {

		var postsFeed = {
			feed:'posts',
			topic: curTopic,
			show_post: t.address.get('post') || 0,
			limit: t.address.get('plimit') || t.cfg.posts_per_page
		}

		var topicFeed = {
			feed:'topic'
			,id: curTopic
			//,fields:['id', 'date_read', 'name', 'post_count'] // пока не работает
		}

		if (curTopic) {
			postsFeed.topic = curTopic;
			topicFeed.id = curTopic;
		} else if (dialogueFromAddress) {
			postsFeed.dialogue = dialogueFromAddress;
			topicFeed.dialogue = dialogueFromAddress;
		}

		initialSubscriptions.push({
			subscriber: t.units.posts,
			feedName:'posts',
			feed:postsFeed
		});

		initialSubscriptions.push({
			subscriber: t.units.posts,
			feedName:'topic_data',
			feed:topicFeed
		});

		t.ui.activateUnit('posts')
	} else {
		t.ui.activateUnit('topics')
	}


	t.connection.subscribe(initialSubscriptions);


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

	t.connection.start();
}

$(window).on('load', tinng.funcs.onWindowLoad)