/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 4:40 PM
 * To change this template use File | Settings | File Templates.
 */

/* ОСНОВНОЙ ДВИЖОК ОБНОВЛЕНИЯ */

tinng.protos.Rotor = function (backendURL, syncCollection, parseCallback) {


	this.backendURL = backendURL;
	this.syncCollection = syncCollection; //TODO придумать, как передавать параметры, чтобы ротор был более независимым
	this.parseCallback = parseCallback;

	this.waitTime = t.state.blurred ? t.cfg['poll_timer_blurred'] : t.cfg['poll_timer'];
	this.request = false; // запрос
	this.timeout = false; // текущий таймаут

	this.$stateIndicator = $('.state-ind');

	// проксирование функций
	this.start = $.proxy(this, 'start');
    this.wrappedStart = $.proxy(this, 'wrappedStart');
	this.stop = $.proxy(this, 'stop');
	this.onResponse = $.proxy(this, 'onResponse');
	this.onAbort = $.proxy(this, 'onAbort');
}

tinng.protos.Rotor.prototype = {


	// главная функция ротора
	start:function (action, params) {
	    var that = this;
        setTimeout(function(){
            that.wrappedStart(action, params)
        })
	},

    // todo: этот таймаут нужен из-за несовершенства системы XHR, баг вылазит во время создания новой темы - отправка
    // запроса сразу после получения предыдущего происходит до закрытия соединения и новое соединение не проходит
    wrappedStart:function(action, params){


        //console.log('rotor start: ', action);

        // параметры, которые должны не сохраняться, а задаваться каждый раз из аргументов
        t.sync.action = action ? action : '';
        t.sync.params = params ? params : {};
        this.action = t.sync.action;

        // останавливаем предыдущий запрос/таймер если находим
        if (this.request || this.timeout) this.stop();

        this.startIndication(); // показываем, что запрос начался

        // Отправляем запрос
        this.request = new JsHttpRequest();
        this.request.onreadystatechange = this.onResponse;
        this.request.open(null, this.backendURL, true);
        this.request.send(this.syncCollection);

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
	},

	// Выполняется при удачном возвращении запроса
	onResponse:function () {


    	if (this.request.readyState == 4) {

			// разбираем пришедший пакет и выполняем обновления
			t.sync.maxdateTS = this.parseCallback(this.request.responseJS, this.action, t);

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
