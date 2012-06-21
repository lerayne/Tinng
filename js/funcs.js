/**
 * Created by JetBrains PhpStorm.
 * User: Lerayne
 * Date: 01.05.12
 * Time: 17:11
 * To change this template use File | Settings | File Templates.
 */

// Главный объект который передается во все прототипы.
// Здесь должен полностью прописываться интерфейс этого объекта
tinng = {

	// коллекции объектов
	units:{}, // отсеки (колонки) интерфейса
	topics:{}, // отображаемые темы
	posts:{}, // отображаемые сообщения

	// коллекции полей
	cfg:cfg, // конфигурация
	txt:txt, // текстовые переменные
	state:{}, // записи о состоянии программы
	sync:{}, // переменные, передаваемые на сервер
	data:{}, // здесь пока будут данные

	// экземпляры классов
	chunks:null,
	rotor:null,
	ui:null,
	address:null,

	// наборы статических методов
	funcs:null, // независимые от движка функции

	protos:{ // прототипные классы
		ui:{} // ..контролов и интерфейсных элементов
	}
}

// Данные
tinng.data = {
	units:[
		{name:'topics', css:{width:'40%'}},
		{name:'posts', css:{width:'60%'},
			header:[
				{type:'Field', label:'topicName', cssClass:'topicname'}
			]
		}
	]
}

// Колекция параметров, передаваемых на мервер при каждом запросе
tinng.sync = {
	action:'',
	maxdateTS:0,
	curTopic:0,
	plimit:1,
	pglimdateTS:0,
	topicSort:'updated',
	tsReverse:true,
	params:{}
}

tinng.state.blurred = false; //TODO отслеживать активность окна


Funcs = function () {
};

Funcs.prototype = {
	tinng:tinng,

	// функция ошибки сеттера для финальных свойств
	setterError:function () {
		throw('trying to overwrite final property');
	},


	// запись в консоль
	log:function (text) {
		var t = this.tinng;

		if (t.cfg['logging']) {
			var date = new Date(), time;

			if (date.toLocaleFormat) {
				time = date.toLocaleFormat('%H:%M:%S');
			} else {
				var temp = {};
				temp.H = date.getHours();
				temp.M = date.getMinutes();
				temp.S = date.getSeconds();
				for (var i in temp) {
					if (temp[i] * 1 < 10) temp[i] = '0' + temp[i];
				}
				time = temp.H + ':' + temp.M + ':' + temp.S;
			}
			console.info(time + ' - ' + text);
		}
	},


	// обработчик таймаута
	advClearTimeout:function (timeout) {
		if (timeout) {
			this.log('timeout found: ' + timeout + '. cleared', 1);
			clearTimeout(timeout);
		}
		return false;
	},


	// оздать таймстамп из строки с SQL
	sql2stamp:function (str) {
		if (!str) return false;
		var str1 = str.split(' ');
		var dates = str1[0].split('-');
		var times = str1[1].split(':');
		return new Date(dates[0], dates[1] - 1, dates[2], times[0], times[1], times[2]).getTime();
	},

	loadMore:function(pageLimit){
		var t = this.tinng;

		t.sync.plimit = pageLimit;
		t.address.set('plimit', pageLimit);
		t.rotor.start('next_page');
	}
}

tinng.funcs = new Funcs();

(function ($) {
	$.fn.extend({
		'offsetHeight':function () {
			return this[0].offsetHeight;
		}
	});

	$.fn.extend({
		'offsetWidth':function () {
			return this[0].offsetWidth;
		}
	});
})(jQuery);


Address = function (delimSign, eqSign) {

	this.vars = {};
	this.delimSign = delimSign;
	this.eqSign = eqSign;

	var pairs = this.load(), pair, varName, value;

	if (pairs.length) for (var i in pairs) {
		pair = pairs[i].split(this.eqSign);
		varName = pair[0];
		value = pair[1];
		if (varName !== '') this.vars[varName] = value;
	}
}

Address.prototype = {

	load:function () {
		if (location.hash.length > 2 && location.hash.indexOf(this.eqSign) != -1) {
			return location.hash.replace('#', '').split(this.delimSign);
		} else return [];
	},

	write:function (args) {

		if (args && args.length == 1 && typeof args[0] == 'object') for (var key in args[0]) this.vars[key] = args[0][key];
		if (args && args.length == 2 && typeof args[0] == 'string') this.vars[args[0]] = args[1];

		var newHash = [];
		for (var key in this.vars) newHash.push(key + this.eqSign + this.vars[key]);
		location.hash = newHash.join(this.delimSign);
	},

	set:function () {
		this.write(arguments);
	},

	get:function (varName) {
		return (this.vars[varName]) ? this.vars[varName] : false;
	},

	del:function (varName) {
		delete(this.vars[varName]);
		this.write();
	}
}

tinng.address = new Address(';', ':');


// Конструтор классов, спасибо Riim (javascript.ru)
var Class = (function () {

	var extend = Object.extend = function (self, obj) {
		if (self == null) self = {};
		for (var key in obj) self[key] = obj[key];
		return self;
	}

	return function (parent, declaration) {

		var Klass = function () {
			this.initialize.apply(this, arguments);
		}

		if (typeof parent == 'function') {
			function F() {
			}

			F.prototype = parent.prototype;
			Klass.prototype = new F();
		} else {
			if (parent != null) declaration = parent;
			parent = Object;
		}

		extend(Klass.prototype, declaration).initialize || (Klass.prototype.initialize = Function.blank);
		Klass.superclass = parent;
		Klass.prototype.superclass = parent.prototype;
		return Klass.prototype.constructor = Klass;
	};

})();
