/**
 * Created with JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 11/14/13
 * Time: 6:11 PM
 * To change this template use File | Settings | File Templates.
 */

// в данной реализации класс абсолютно закрывает содержимое внутреннего, но возможна и иная комбирация - в этом случае
// нужен return new InternalClass() в конструкторе. Само собой, возможна и полузакрытая схема
tinng.protos.Connection = function (config) {

	this.subscribers = []

	// настройки по умолчанию и их перегрузка
	this.conf = t.funcs.objectConfig(config, this.defaultConf = {
		server:'',
		callback:function(){}
	});

	// заглушка на определение класса, который должен будет исполнять роль connection
	if (true) {
		this.wrappedClass = tinng.protos.strategic.XHRShortPoll;
		this.wrappedClassName = 'tinng.protos.strategic.XHRShortPoll';
	}
	var wrapped = this.engine = new this.wrappedClass(this.conf.server, this.conf.callback);

	// проверка встроенного класса на совместимость

	var requiredMethods = [
		'write',
		'subscribe',
		'rescribe',
		'unscribe',
		'stop',
		'resume'
	]

	for (var j = 0; j < requiredMethods.length; j++) {
		var methodName = requiredMethods[j];

		if (typeof this.wrappedClass[methodName] != 'function' && typeof this.wrappedClass.prototype[methodName] != 'function') {
			console.error('Strategic wrapper error: method '+ methodName +' is not present in strategic class '+ this.wrappedClassName);
		}
	}

	// вызывается внутри некоторых активных методов. Не требует обязательной реализации во внутреннем классе
	// например при шорт-поллинге этот метод сразу отправляет новый запрос после любого изменения
	this.refresh = function(){

		if (wrapped.refresh) {
			return wrapped.refresh.apply(wrapped, arguments);
		} else {
			return false;
		}
	}

	// осуществляет запись данных на сервер
	this.write = function(){
		return wrapped.write.apply(wrapped, arguments);

		this.refresh();
	}

	// подписывает объект на новый фид, или редактирует значение существующего, сбрасывая внутренее состояние подписки
	// может принимать объект с полями subscriber, feedName и  feed, аргументы в таком порядке, или массив таких объектов
	this.subscribe = function(){
		this.callScribe(wrapped, 'subscribe', arguments);

		return this.refresh();
	}

	// мягко изменяет параметры подписки, не сбрасывая ее внутреннее состояние
	// может принимать объект с полями subscriber, feedName и  feed, аргументы в таком порядке, или массив таких объектов
	this.rescribe = function(){
		this.callScribe(wrapped, 'rescribe', arguments);

		return this.refresh();
	}

	// todo - возможно, стоит сделать отдельно мягкую подписку и переподписку, чтобы принудительно очищать вспомогатьельные и необязательные парамтеры
	// ну и вообще подумать о назначении и правилах действия методов

	// удаляет подписку
	// может принимать объект с полями subscriber и feedName, аргументы в таком порядке, или массив таких объектов
	this.unscribe = function() {
		this.callScribe(wrapped, 'unscribe', arguments);

		//вроде как здесь не обязательно, потому что отписка не подразумевает возвращения данных
		//если так - это сильно упрощает работу :)
		//return this.refresh();
	}

	// приостанавливает соединение
	this.stop = function(){
		return wrapped.stop.apply(wrapped, arguments)
	}

	// возобновляет работу соединения
	this.resume = function(){
		return wrapped.resume.apply(wrapped, arguments)
	}
}

tinng.protos.Connection.prototype = {
	subscriberId:function(object){
		if (this.subscribers.indexOf(object) == -1) this.subscribers.push(object)

		return	this.subscribers.indexOf(object)
	},

	callScribe: function(object, funcName, args){

		if (args.length > 1) {
			args[0] = this.subscriberId(args[0]);

			this['copy_'+funcName].apply(this, args);
			return object[funcName].apply(object, args);

		} else if (args[0] instanceof Array) {
			for (var i = 0; i < args[0].length; i++) {

				var params = args[0][i];
				var subscriberId = this.subscriberId(params.subscriber);

				this['copy_'+funcName](subscriberId, params.feedName, params.feed);
				object[funcName].call(object, subscriberId, params.feedName, params.feed);
			}

		} else if (args[0] instanceof Object) {

			var params = args[0];
			var subscriberId = this.subscriberId(params.subscriber);

			this['copy_'+funcName](subscriberId, params.feedName, params.feed);
			object[funcName].call(object, subscriberId, params.feedName, params.feed);
		}
	},

	// создает копию подписки в объекте-подписчике
	copy_subscribe:function(subscriberId, feedName, feed){

		var subscriberFeeds = this.subscribers[subscriberId].subscriptions;

		// если такой подписчик уже есть
		if (subscriberFeeds) {

			if (subscriberFeeds[feedName]) for (var key in feed) subscriberFeeds[feedName][key] = feed[key];
			else subscriberFeeds[feedName] = feed;

		} else { // иначе создаем подписчика и подписку у него
			this.subscribers[subscriberId].subscriptions = {};
			this.subscribers[subscriberId].subscriptions[feedName] = feed;
		}
	},

	copy_rescribe:function(){
		this.copy_subscribe.apply(this, arguments);
	},

	// удаляет копию подписки в объекте-подписчике
	copy_unscribe:function(subscriberId, feedName){
		var subscriber = this.subscribers[subscriberId];

		if (subscriber.subscriptions && subscriber.subscriptions[feedName])
			delete this.subscribers[subscriberId].subscriptions[feedName];

	}

}