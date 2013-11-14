/**
 * Created with JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 11/14/13
 * Time: 5:38 PM
 * To change this template use File | Settings | File Templates.
 */

// при первом вызове присваивает id вызывавшему объекту и заносит его в список. При повторном вызове просто возвращает id
unit.subscriberId()

// подписывается на изменения, привязывает их к id подписчика. Повторный вызов перезаписывает подписку поверх
t.connection.subscribe( unit.subscriberId(), {
	feed:'topics',
	filter:{tags:'1|2'},
	sort:'updated',
	reverse_sort:true
});

// выборочно изменяет переметры подписки
t.connection.rescribe( unit.subscriberId(), {
	sort:'alphabet'
})

// снимает подписку с объекта
t.connection.unscribe( unit.subscriberId());

// посылает на сервер запрос на изменение данных. Не зависит от подписок, поэтому должен содержать подробные данные
t.connection.write({
	action:'new_message',
	topic:700,
	message:'это мой новый пост!'
})

/*
* все пересетры должны принимать аргументы не жестко, так как в будущем может понадобиться еще как минимум один элемент -
* идентификатор самой подписки. Это на тот случай, если я захочу дать подписчику возможность подписываться на несколько
* фидов одновременно. Сейчас принят закон, что у одного подписчика может быть только один фид и он однозначно
* идентифицируется по id подписчика
* */