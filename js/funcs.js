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

	// наборы статических методов
	funcs:null, // независимые от движка функции

	protos:{} // прототипы
}

// Данные
tinng.data = {
	units:[
		{name:'topics', css:{width:'40%'}},
		{name:'posts', css:{width:'60%'}}
	]
}

// Колекция параметров, передаваемых на мервер при каждом запросе
tinng.sync = {
	action:'',
	maxdateTS:0,
	curTopic:0,
	plimit:1,
	pglimitdateTS:0,
	topicSort:'updated',
	tsReverse:true,
	params:{}
}

tinng.state.blurred = false; //TODO отслеживать активность окна


Funcs = function () {}

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
