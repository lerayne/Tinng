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
		var wrapped = new this.wrappedClass(this.conf.server, this.conf.callback);
	}

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

			return object[funcName].apply(object, args);

		} else if (args[0] instanceof Array) {
			for (var i = 0; i < args[0].length; i++) {

				var params = args[0][i];

				object[funcName].call(object, this.subscriberId(params.subscriber), params.feedName, params.feed);
			}

		} else if (args[0] instanceof Object) {

			var params = args[0];

			object[funcName].call(object, this.subscriberId(params.subscriber), params.feedName, params.feed);
		}
	}
}