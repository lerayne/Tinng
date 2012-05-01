/**
 * Created by JetBrains PhpStorm.
 * User: Lerayne
 * Date: 28.04.12
 * Time: 18:55
 * To change this template use File | Settings | File Templates.
 */

tinng.state.blurred = false; //TODO отслеживать активность окна



// ОСНОВНОЙ ДВИЖОК ОБНОВЛЕНИЯ
Rotor = function(backendURL, syncCollection, parseCallback ){
	var t = this.tinng;

	this.backendURL = backendURL;
	this.syncCollection = syncCollection; //TODO придумать, как передавать параметры, чтобы ротор был более независимым
	this.parseCallback = parseCallback;

	this.waitTime = t.state.blurred ? t.cfg['poll_timer_blurred'] : t.cfg['poll_timer'];
	this.request = false; // запрос
	this.timeout = false; // текущий таймаут

	this.$stateIndicator = $('.state-ind');

	// проксирование функций
	this.start = $.proxy(this, 'start');
	this.stop = $.proxy(this, 'stop');
	this.onResponse = $.proxy(this, 'onResponse');
	this.onAbort = $.proxy(this, 'onAbort');

	// сортировка по умолчанию
	this.topicSort = 'updated';
	this.tsReverse = true;
}

Rotor.prototype = {
	tinng: tinng,

	// главная функция ротора
	start: function(action, params){
		var t = this.tinng;

		// параметры, которые должны не сохраняться, а задаваться каждый раз из аргументов
		t.sync.action = action ? action : '';
		t.sync.params = params ? params : {};

		// останавливаем предыдущий запрос/таймер если находим
		if (this.request || this.timeout) this.stop();

		this.startIndication(); // показываем, что запрос начался

		// Отправляем запрос
		this.request = new JsHttpRequest();
		this.request.onreadystatechange = this.onResponse;
		this.request.open(null, this.backendURL, true);
		this.request.send(this.syncCollection);

		t.funcs.log('Launching query with timeout '+this.waitTime);
	},

	// Останавливает ротор
	stop: function() {
		var t = this.tinng;

		this.timeout = t.funcs.advClearTimeout(this.timeout);

		if (this.request) {
			// переопределяем, иначе rotor воспринимает экстренную остановку как полноценное завершение запроса
			this.request.onreadystatechange = this.onAbort;
			this.request.abort();
			this.request = false;

			t.funcs.log('STOP occured while WAITING. Query has been ABORTED');
		}
	},

	// Выполняется при удачном возвращении запроса
	onResponse: function(){
		var t = this.tinng;

		if (this.request.readyState == 4) {

			// разбираем пришедший пакет и выполняем обновления
			t.sync.maxdateTS = this.parseCallback(this.request.responseJS, this.action, t);

			this.stopIndication(); // индикация ожидания откл
			this.request = false;
			this.timeout = setTimeout(this.start, this.waitTime);
		}
	},

	// Выполняется при принудительном сбросе запроса
	onAbort: function(){
		this.stopIndication();
	},

	// изменение времени ожидания
	changeTimeout: function(msec){
		this.waitTime = msec;
		this.start();
	},

	// как-то отмечаем в интерфейсе что запрос ушел
	startIndication: function(){
		this.$stateIndicator.addClass('updating');
	},

	// как-то отмечаем в интерфейсе что запрос закончен
	stopIndication: function(){
		this.$stateIndicator.removeClass('updating');
	}
}



tinng.funcs.parser = function(result, actionUsed, t){

	if (result && result.error) alert(t.txt.post_locked);

	var tProps = (result && result.topic_prop) ? result.topic_prop : [];

	var entry, topic;

	// разбираем темы
	if (result && result.topics) {
		for (var i in result.topics) {
			entry = result.topics[i];

			// если в текущем массиве загруженных тем такая уже есть - обновляем существующую
			if (t.topics[entry.id]){
				topic = t.topics[entry.id];

				if (entry.deleted){

					shownRemove(topic.item); //todo: вывести в метод объекта темы
					if (entry.id == t.sync.curTopic) t.funcs.unloadTopic();
					delete(t.topics[entry.id]);

				} else {
					topic.fill(entry);
					topic.bump();
				}

				// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
			} else if (!entry.deleted) {

				t.topics[entry.id] = new TopicNode(entry); //todo: тут пока замыкание
				t.units.topics.$content.append(t.topics[entry.id].$body);
				if (tProps['new']) loadTopic(entry.id);
				//ifblur_notify('New Topic: '+entry.topic_name, entry.message);
			}
		}
	}

	return t.funcs.sql2stamp(result.new_maxdate);
}



TopicNode = function(data){
	var t = this.tinng;

	var $body = this.$body = t.chunks.get('topic');

	var cells = [
		'created',
		'author',
		'id',
		'postsquant',
		'topicname',
		'message',
		'lastmessage',
		'tags',
		'controls'
	];

	this.cells = {};
	for (var i in cells) this.cells['$'+cells[i]] = $body.find('[data-cell="'+cells[i]+'"]');

	// заполняем неизменные данные, присваеваемые единожды
	$body.attr('id', 'topic_'+data.id);
	this.cells.$message.addClass('message_'+data.id);
	this.cells.$id.text(data.id);

	this.fill(data); // при создании - сразу заполняем
}

TopicNode.prototype = {
	tinng: tinng,

	fill: function(data){
		var t = this.tinng;

		this.cells.$message.html	(data.message);
		this.cells.$topicname.html	(data.topic_name);
		this.cells.$created.text	(data.modified ? t.txt.modified + data.modified : data.created);
		this.cells.$author.text		(data.author);
		this.cells.$postsquant.text	(data.postsquant + t.txt.msgs);

		if (data.last_id){
			this.cells.$lastmessage.html(
				t.txt.lastpost + '<b>' + data.lastauthor + '</b> ('+ data.lastdate + ') '+ data.lastpost
			);
		}
	},
	
	bump: function(){
		var t = this.tinng;

		if (t.sync.topicSort == 'updated' && t.sync.tsReverse == true){
			this.$body.remove();
			t.units.topics.$content.prepend(this.$body);
		}
	}
}


// ЗАПУСК КОНТЕЙНЕРА
ContentStarter = function(){
	var t = this.tinng;

	t.rotor = new this.Rotor (
		'/backend/update.php',
		t.sync,
		t.funcs.parser
	);
	t.rotor.start('load_pages');
}

ContentStarter.prototype = {
	tinng: tinng,
	Rotor: Rotor
}