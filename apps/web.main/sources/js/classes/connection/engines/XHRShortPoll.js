/**
 * Created with JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 11/14/13
 * Time: 6:12 PM
 * To change this template use File | Settings | File Templates.
 */

tinng.protos.strategic.XHRShortPoll = function(server, callback, autostart){
	t.funcs.bind(this);

	this.backendURL = server;
	this.parseCallback = callback;

	console.log('focus on startup:', t.state.windowFocused)

	this.active = autostart;
	this.waitTime = t.state.windowFocused ? t.cfg['poll_timer'] : t.cfg['poll_timer_blurred'];
	this.request = false; // запрос
	this.timeout = false; // текущий таймаут
	this.connectionLossTO = false; // таймаут обрыва связи

	this.$stateIndicator = $('.state-ind');

	this.subscriptions = {};
	//console.log('XHRShortPoll construct meta init')
	this.meta = {};
	this.actions = {};
	this.latest_change = 0;
}

tinng.protos.strategic.XHRShortPoll.prototype = {

	// интерфейсные методы
	refresh:function(){
		return this.querySend();
	},

	setMode:function(mode){

		switch (mode){
			case 'active':
				this.waitTime = t.cfg['poll_timer'];
				this.refresh();

				break;

			case 'passive':
				this.waitTime = t.cfg['poll_timer_blurred'];

				break;
		}
	},

	write:function(params){

		if (params instanceof Array) this.actions = params;
		else this.actions[0] = params;

	},

	_subscribe:function(subscriberId, feedName, feed, reset){
		var subscriberFeeds = this.subscriptions[subscriberId];

		// если такой подписчик уже есть
		if (subscriberFeeds) {

			// если такая подписка уже есть у подписчика
			if (subscriberFeeds[feedName]){
				for (var key in feed) {
					subscriberFeeds[feedName][key] = feed[key];
				}

				// сбрасываем ее мету
				if (reset && this.meta[subscriberId]) {
					//console.log('META RESET on subscribe:', subscriberId, feedName)
					this.meta[subscriberId][feedName] = {};
				}

				// иначе создаем новую подписку
			} else subscriberFeeds[feedName] = feed;

		} else { // иначе создаем подписчика и подписку у него
			this.subscriptions[subscriberId] = {};
			this.subscriptions[subscriberId][feedName] = feed;
		}
	},

	// подписывает, или изменяет параметры текущей подписки
	subscribe:function(subscriberId, feedName, feed){
		this._subscribe(subscriberId, feedName, feed, true)
	},

	// "мягко" изменяет параметры подписки, не меняя ее метаданные
	// пока-что нужно для динамической подгрузки "страниц"
	rescribe:function(subscriberId, feedName, feed){
		this._subscribe(subscriberId, feedName, feed, false)
	},

	// отменяет подписку
	unscribe:function(subscriberId, feedName){

		// если такой вообще есть
		if (this.subscriptions[subscriberId] && this.subscriptions[subscriberId][feedName]) {

			delete this.subscriptions[subscriberId][feedName];

			if (this.meta[subscriberId]) {
				//console.log('META DELETE on UNscribe:', subscriberId, feedName)
				delete this.meta[subscriberId][feedName];
			}

			// считаем, сколько подписок осталось
			var i = 0;
			for (var key in this.subscriptions[subscriberId]) {
				/*if (this.subscriptions[subscriberId].propertyIsEnumerable(key))*/ i++;
			}

			// если ни одной - прибиваем подписчика
			if (i == 0) {
				delete this.subscriptions[subscriberId];

				//console.log('SUBSCRIBER DELETE:', subscriberId)
				delete this.meta[subscriberId];
			}
		}
	},




	start:function(){
		if (!this.active) {
			this.active = true;
			this.querySend();
		}
	},

	stop:function(){
		if (this.active) {
			this.active = false;
			this.queryCancel();
		}
	},

	// отправка запроса
	querySend:function () {
		if (this.active && t.cfg.maintenance == 0) setTimeout(this.wrappedQuerySend, 0);
		return true;
	},

	// todo: этот враппер-таймаут нужен из-за несовершенства обертки XHR, баг вылазит во время создания новой темы -
	// отправка запроса сразу после получения предыдущего происходит до закрытия соединения и новое соединение не проходит
	wrappedQuerySend:function(){

		//t.notifier.send('connection start', this.waitTime);

		// останавливаем предыдущий запрос/таймер если находим
		if (this.request || this.timeout) this.queryCancel();

		this.startIndication(); // показываем, что запрос начался

		//console.log('this.subscriptions:', this.subscriptions);
		// var now = new Date();
		//if (!t.funcs.objectSize(this.meta)) console.log(now.getTime()+' META EMPTY!');

		/*try {
			// Отправляем запрос
			this.request = new JsHttpRequest();
			this.request.onreadystatechange = this.onResponse;
			this.request.open(null, this.backendURL, true);
			this.request.send({
				subscribe: this.subscriptions,
				write: this.actions,
				meta:  this.meta
			});
		} catch (e) {
			console.log('error:', e);
		}*/

		this.request = $.ajax({
			type:'post',
			url: this.backendURL,
			cache: false,
			crossDomain: true,
			success: this.onResponse,
			dataType:'json',
			data:{
				user: {
					login: t.funcs.getCookie('login'),
					pass: t.funcs.getCookie('pass')
				},
				subscribe: this.subscriptions,
				write: this.actions,
				meta:  this.meta
			}
		});



		// если соединение длится 20 секунд - признаем его оборвавшимся
		this.connectionLossTO = setTimeout(this.retry, 20000);

		//t.funcs.log('Launching query with timeout ' + this.waitTime);
	},

	retry:function(){
		t.ui.showMessage(t.txt.connection_error);
		console.warn('Registered connection loss. Trying to restart')
		this.queryCancel();
		this.querySend();
	},

	// Останавливает ротор
	queryCancel:function () {

		this.timeout = t.funcs.advClearTimeout(this.timeout);

		clearTimeout(this.connectionLossTO);

		if (this.request) {
			// переопределяем, иначе rotor воспринимает экстренную остановку как полноценное завершение запроса
			this.request.done(this.onAbort);
			this.request.abort();
			this.request = false;

			console.info('Connection STOP occured while waiting. Previous query has been aborted');
		}

		return true;
	},

	// Выполняется при удачном возвращении запроса
	onResponse:function (response) {

		clearTimeout(this.connectionLossTO);

		if (response.debug) {
			console.info('PHP backtrace:\n==============\n', response.debug)
		}

		// todo - иногда от сервера приходит meta в виде массива, а иногда - в виде объекта. разобраться
		if (response.data.meta instanceof Array) {

			this.meta = {};
			for (var i = 0; i < response.data.meta.length; i++) {
				var metaItem = response.data.meta[i];
				this.meta[i] = metaItem;
			}
		} else {
			this.meta = response.data.meta;
		}

		// разбираем пришедший пакет и выполняем обновления
		this.parseCallback(response.data, this.actions);

		this.actions = {};

		this.stopIndication(); // индикация ожидания откл
		this.request = false;

		// перезапускаем запрос
		this.timeout = setTimeout(this.querySend, this.waitTime);
	},

	// Выполняется при принудительном сбросе запроса
	onAbort:function () {
		this.stopIndication();
	},

	// как-то отмечаем в интерфейсе что запрос ушел
	startIndication:function () {
		this.$stateIndicator.addClass('updating');
	},

	// как-то отмечаем в интерфейсе что запрос закончен
	stopIndication:function () {
		this.$stateIndicator.removeClass('updating');
	}
}