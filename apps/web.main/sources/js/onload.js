// TODO - здесь хранятся глобальные todo

// todo - отказаться от некоторых абсолютных адресов - например для прототипов
// todo - определить глобальную терминологию переменных - что есть message, topic, comment, post  итд
// todo - перенести сюда функцию bind из анрома
// todo - создать систему дебага с включением через адрессную строку
// todo - разобраться, почему не поднимается вверх новосозданная тема


tinng.funcs.onWindowLoad = function(){

    // создание машин, использующих селекторы
    t.chunks = new t.protos.ChunksEngine('tinng-chunks', 'data-chunk-name');
    t.ui = new t.protos.UserInterface(window);

    t.rotor = new t.protos.Rotor(
        'backend/update.php',
        t.sync,
        t.funcs.parser
    );

    // загрузка данных из хеша адресной строки
    t.sync.curTopic = parseInt(t.address.get('topic'));

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
