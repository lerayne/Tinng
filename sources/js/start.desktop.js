/**
* @include classes/common/*
* @include classes/desktop/*
* @include parser.js
* */

 // TODO - здесь хранятся глобальные todo

// todo - определить глобальную терминологию переменных - что есть message, topic, comment, post  итд
// todo - создать систему дебага, активируемую параметром адрессной строки


tinng.funcs.onWindowLoad = function(){

	t.state.windowFocused = document.hasFocus();

	t.user = new tinng.protos.User(importedUser);
	if (t.user.id == 1) t.cfg.maintenance = 0;

	// создание машин, использующих селекторы
	t.chunks = new t.protos.ChunksEngine('tinng-chunks', 'data-chunk-name', 'data-cell');
	t.notifier = new t.protos.Notifier();

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

    t.ui = new t.protos.UserInterface(window);
	t.userWatcher = new t.protos.UserWatcher();
	t.stateService = new t.protos.StateService();

    // загрузка данных из хеша адресной строки
	var topicFromAddress = t.address.get('topic');
	var dialogueFromAddress = t.address.get('dialogue');
    t.sync.curTopic = topicFromAddress ? parseInt(t.address.get('topic')) : 0;

	//t.units.topics.startWaitIndication();
	if (!t.sync.curTopic && !dialogueFromAddress) t.units.posts.setInvitation();
	else {
		// todo - еще один костыль, напоминающий, что нужно сделать функцию инициализации темы
		// todo - проблема: здесь массив t.topics еще не заполнен
		//if (t.user.hasRight('editMessage', t.topics[t.sync.curTopic])) t.units.posts.header.topicRename.show();
		//t.units.posts.startWaitIndication();
	}

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

/*$(window).on('beforeunload', function(){

	if (t.user.id > 0) {
		t.notifier.send('unloading');

		// AJAX: // закрываем сессию на сервере

		t.connection.query('service', null, {
 			action: 'close_session'
 		})
	}
})*/
