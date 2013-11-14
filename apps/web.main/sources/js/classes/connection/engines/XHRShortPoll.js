/**
 * Created with JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 11/14/13
 * Time: 6:12 PM
 * To change this template use File | Settings | File Templates.
 */

tinng.protos.strategic.XHRShortPoll = function(server, callback){
	t.funcs.bind(this);

	this.backendURL = server;
	this.parseCallback = callback;

	this.waitTime = t.state.blurred ? t.cfg['poll_timer_blurred'] : t.cfg['poll_timer'];
	this.request = false; // запрос
	this.timeout = false; // текущий таймаут

	this.$stateIndicator = $('.state-ind');

	this.subscriptions = {};
	this.actions = {};
}

tinng.protos.strategic.XHRShortPoll.prototype = {
	write:function(params){

		this.actions = params;

		this.start();
	},

	// подписывает и переподписывает заново
	subscribe:function(){
		var subscriber = arguments[0];
		var feed = arguments[arguments.length-1];

		var subscriberId = t.connection.subscriberId(subscriber);

		this.subscriptions[subscriberId] = feed;

		this.start();
	},

	// изменяет параметры текущей подписки (возможно, поведение стоит поменять наоборот)
	rescribe:function(){
		var subscriber = arguments[0];
		var feedChanges = arguments[arguments.length-1];

		var subscriberId = t.connection.subscriberId(subscriber);

		if (!this.subscriptions[subscriberId]) {
			console.error('no subscription for '+ subscriber);
			return false;
		}

		for (var key in feedChanges) {
			if (this.subscriptions[subscriberId][key]) this.subscriptions[subscriberId][key] = feedChanges[key]
		}

		this.start();
	},

	// отменяет подписку
	unscribe:function(subscriber){
		var subscriberId = t.connection.subscriberId(subscriber);

		if (this.subscriptions[subscriberId]) delete this.subscriptions[subscriberId];

		this.start();
	},




	// главная функция ротора
	start:function () {
		setTimeout(this.wrappedStart, 0);

		return true;
	},

	// todo: этот враппер-таймаут нужен из-за несовершенства обертки XHR, баг вылазит во время создания новой темы -
	// отправка запроса сразу после получения предыдущего происходит до закрытия соединения и новое соединение не проходит
	wrappedStart:function(){

		//console.log('rotor start: ', action);

		// останавливаем предыдущий запрос/таймер если находим
		if (this.request || this.timeout) this.stop();

		this.startIndication(); // показываем, что запрос начался

		// Отправляем запрос
		this.request = new JsHttpRequest();
		this.request.onreadystatechange = this.onResponse;
		this.request.open(null, this.backendURL, true);
		this.request.send({
			subscribe: this.subscriptions,
			write: this.actions
		});

		t.funcs.log('Launching query with timeout ' + this.waitTime);
	},

	// Останавливает ротор
	stop:function () {

		this.timeout = t.funcs.advClearTimeout(this.timeout);

		if (this.request) {
			// переопределяем, иначе rotor воспринимает экстренную остановку как полноценное завершение запроса
			this.request.onreadystatechange = this.onAbort;
			this.request.abort();
			this.request = false;

			t.funcs.log('STOP occured while WAITING. Query has been ABORTED');
		}

		return true;
	},

	resume:function(){
		return this.start();
	},

	// Выполняется при удачном возвращении запроса
	onResponse:function () {

		if (this.request.readyState == 4) {

			if (this.request.responseText) {
				console.log('PHP backtrace:\n==============\n'+this.request.responseText)
			}

			// разбираем пришедший пакет и выполняем обновления
			t.sync.maxdateTS = this.parseCallback(this.request.responseJS, this.actions);

			this.actions = {};


			this.stopIndication(); // индикация ожидания откл
			this.request = false;
			this.timeout = setTimeout(this.start, this.waitTime);
		}
	},

	// Выполняется при принудительном сбросе запроса
	onAbort:function () {
		this.stopIndication();
	},

	// изменение времени ожидания
	changeTimeout:function (msec) {
		this.waitTime = msec;
		this.start();
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