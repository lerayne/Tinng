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

	if (result.actions) {
		for (var actionId in result.actions){
			var actionResponse = result.actions[actionId];

			switch (actionResponse.action) {
				case 'add_topic':

					// todo - проверка существования ВСЕХ модулей, которые может заинтересовать такая инфа
					if (t.units.posts) t.units.posts.subscribe(actionResponse.id, t.cfg.posts_per_page);

				break;
			}
		}
	}

	if (result.feeds) {
		for (var subscriberId in result.feeds) {
			if (t.connection.subscribers[subscriberId] && t.connection.subscribers[subscriberId].parseFeed) {

				t.connection.subscribers[subscriberId].parseFeed(result.feeds[subscriberId], actions);
			} else
				console.error('subscriber ', subscriberId, ' doesnt exist, or have no "parseFeed" method. Result:', result);
		}
	}
}


tinng.funcs.parser2.prototype = {

}
