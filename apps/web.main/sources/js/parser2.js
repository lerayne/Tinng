/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 4:43 PM
 * To change this template use File | Settings | File Templates.
 */

/* ФУНКЦИЯ РАЗБОРА ДАННЫХ ОБ ИЗМЕНЕНИИ */

tinng.funcs.parser2 = function (result, actions) {

	if (!result) return false;

	if (result.feeds) {
		for (var cubscriberId in result.feeds) {
			if (t.connection.subscribers[cubscriberId] && t.connection.subscribers[cubscriberId].parseFeed) {

				t.connection.subscribers[cubscriberId].parseFeed(result.feeds[cubscriberId]);
			} else console.error('subscriber ', cubscriberId, ' doesnt exist, or have no "parseFeed" method. See subscribers:', t.connection.subscribers);
		}
	}
}


tinng.funcs.parser.prototype = {

}
