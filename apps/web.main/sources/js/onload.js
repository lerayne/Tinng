/**
* @include classes/*
* @include parser.js
*
* */

 // TODO - здесь хранятся глобальные todo

// todo - определить глобальную терминологию переменных - что есть message, topic, comment, post  итд
// todo - создать систему дебага, активируемую параметром адрессной строки


tinng.funcs.onWindowLoad = function(){

	// создание машин, использующих селекторы
	t.chunks = new t.protos.ChunksEngine('tinng-chunks', 'data-chunk-name', 'data-cell');

	t.user = new tinng.protos.User(importedUser);
	t.address = new tinng.protos.Address(';', ':');
	//t.keyListener = new tinng.protos.KeyListener();

	t.connection = new t.protos.Connection({
		server:'backend/update/',
		callback:t.funcs.parser2
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
}

$(window).on('load', tinng.funcs.onWindowLoad)

/*window.onbeforeunload = function(){
 //alert('exiting program!');

 // AJAX: // закрываем сессию на сервере
 JsHttpRequest.query( 'backend/service.php', {

 action: 'close_session'

 }, function(){}, false );

 rotor.stop();

 }*/
