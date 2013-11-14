// TODO - здесь хранятся глобальные todo

// todo - отказаться от некоторых абсолютных адресов - например для прототипов
// todo - определить глобальную терминологию переменных - что есть message, topic, comment, post  итд
// todo - создать систему дебага, активируемую параметром адрессной строки


tinng.funcs.onWindowLoad = function(){

    // создание машин, использующих селекторы
    t.chunks = new t.protos.ChunksEngine('tinng-chunks', 'data-chunk-name');
    t.ui = new t.protos.UserInterface(window);

    t.rotor = new t.protos.Rotor(
        'backend/update.php',
        t.sync,
        t.funcs.parser
    );

	t.stateService = new t.protos.StateService();

    // загрузка данных из хеша адресной строки
	var topicFromAddress = t.address.get('topic');
    t.sync.curTopic = topicFromAddress ? parseInt(t.address.get('topic')) : 0;

	t.units.topics.startWaitIndication();
	if (!t.sync.curTopic) t.units.posts.setInvitation();
	else {
		// todo - еще один костыль, напоминающий, что нужно сделать функцию инициализации темы
		// todo - проблема: здесь массив t.topics еще не заполнен
		//if (t.user.hasRight('editMessage', t.topics[t.sync.curTopic])) t.units.posts.header.topicRename.show();
		t.units.posts.startWaitIndication();
	}

    // такая конструкция нужна для того, чтобы 0 воспринимался как значение
    var loadedLimit = t.address.get('plimit');
    t.sync.plimit = (loadedLimit === false) ? t.sync.plimit : parseInt(loadedLimit);

    // запуск соединения с сервером
    t.rotor.start('load_pages');
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
