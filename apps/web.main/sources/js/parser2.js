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
		for (var subscriberId in result.feeds) {
			if (t.connection.subscribers[subscriberId] && t.connection.subscribers[subscriberId].parseFeed) {

				t.connection.subscribers[subscriberId].parseFeed(result.feeds[subscriberId], actions);
			} else
				console.error('subscriber ', subscriberId, ' doesnt exist, or have no "parseFeed" method. Result:', result);
		}
	}
}


tinng.funcs.parser.prototype = {

}
