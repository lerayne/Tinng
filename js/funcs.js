/**
 * Created by JetBrains PhpStorm.
 * User: Lerayne
 * Date: 01.05.12
 * Time: 17:11
 * To change this template use File | Settings | File Templates.
 */

funcs = {

	// функция ошибки сеттера для финальных свойств
	setterError: function () {
		throw('trying to overwrite final property');
	},


	// запись в консоль
	log: function (text) {
		if (tinng.cfg['logging']) {
			var date = new Date(), time;

			if (date.toLocaleFormat) {
				time = date.toLocaleFormat('%H:%M:%S');
			} else {
				var t = {};
				t.H = date.getHours();
				t.M = date.getMinutes();
				t.S = date.getSeconds();
				for (var i in t) {
					if (t[i] * 1 < 10) t[i] = '0' + t[i];
				}
				time = t.H + ':' + t.M + ':' + t.S;
			}
			console.info(time + ' - ' + text);
		}
	},


	// обработчик таймаута
	advClearTimeout: function (timeout) {
		if (timeout) {
			this.log('timeout found: ' + timeout + '. cleared', 1);
			clearTimeout(timeout);
		}
		return false;
	},

	sql2stamp: function(str) {
		if (!str) return false;
		var str1 = str.split(' ');
		var dates = str1[0].split('-');
		var times = str1[1].split(':');
		return new Date(dates[0], dates[1]-1, dates[2], times[0], times[1], times[2]).getTime();
	}
}
