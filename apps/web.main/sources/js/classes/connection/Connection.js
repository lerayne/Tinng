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

	// todo - пробовал сделать в цикле - фигня получается. Попробовать еще
	this.write = function(){
		return wrapped.write.apply(wrapped, arguments)
	}

	this.subscribe = function(){
		return wrapped.subscribe.apply(wrapped, arguments)
	}

	this.unscribe = function(){
		return wrapped.unscribe.apply(wrapped, arguments)
	}

	this.rescribe = function(){
		return wrapped.rescribe.apply(wrapped, arguments)
	}

	this.stop = function(){
		return wrapped.stop.apply(wrapped, arguments)
	}

	this.resume = function(){
		return wrapped.resume.apply(wrapped, arguments)
	}
}

tinng.protos.Connection.prototype = {
	subscriberId:function(object){
		if (this.subscribers.indexOf(object) == -1) this.subscribers.push(object)

		return	this.subscribers.indexOf(object)
	}
}