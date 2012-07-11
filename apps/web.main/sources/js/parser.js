/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 4:43 PM
 * To change this template use File | Settings | File Templates.
 */

/* ФУНКЦИЯ РАЗБОРА ДАННЫХ ОБ ИЗМЕНЕНИИ */

tinng.funcs.parser = function (result, actionUsed) {
	var t = this.tinng;

	if (result && result.error) alert(t.txt.post_locked);

	var tProps = (result && result.topic_prop) ? result.topic_prop : [];

	var i, entry, topic, post;

	// разбираем темы
	if (result && result.topics) {

		for (i in result.topics) {
			entry = result.topics[i];
			topic = t.topics[entry.id];

			// если в текущем массиве загруженных тем такая уже есть - обновляем существующую
			if (topic) {

				if (entry.deleted) {

					topic.remove('fast');
					if (entry.id == t.sync.curTopic) t.funcs.unloadTopic();
					delete(topic);

				} else {
					topic.fill(entry);
					topic.bump();
				}

				// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
			} else if (!entry.deleted) {

				topic = t.topics[entry.id] = new t.protos.TopicNode(entry);
				t.units.topics.addNode(topic);
				if (tProps['new']) topic.loadPosts();
				//ifblur_notify('New Topic: '+entry.topic_name, entry.message);
			}
		}

		t.units.topics.contentLoaded = 1;
	}

	// разбираем посты
	if (result && result.posts) {

		t.units.posts.header.topicName.$body.html(tProps.name); //вывод названия темы

		if (tProps.show_all) {
			t.units.posts.$showMore.hide();
		} else t.units.posts.$showMore.show();

		// если страница догружалась
		if (actionUsed == 'next_page') {
			var rememberTop = t.units.posts.$content.children()[0];
			var more_height = t.units.posts.$showMore.offsetHeight();
//			console.log('moreH=' + more_height);
		}

		for (var i in result.posts) {
			entry = result.posts[i];
			post = t.posts[entry.id];

			if (post) { // если в текущем массиве загруженных сообщений такое уже есть

				if (entry.deleted) {

					post.remove();

				} else post.fill(entry);

			} else if (!entry.deleted) { // если в текущем массиве такого нет и пришедшее не удалено

				post = t.posts[entry.id] = new t.protos.PostNode(entry);
				t.units.posts.addNode(post);
			}
		}

		if (tProps.scrollto) t.posts[tProps.scrollto].show(false);

		if (actionUsed == 'next_page') {
			rememberTop.scrollIntoView(true);
//			console.log(t.units.posts.$scrollArea.scrollTop())
			t.units.posts.$scrollArea.scrollTop(t.units.posts.$scrollArea.scrollTop() - more_height - 3);
		} // todo - неправильно прокручивается, если до догрузки все сообщения помещались и прокрутка не появлялась

		// наличие id означает что тема загружается в первый раз, а не догружается.
		// todo - исправить фиговое опредление!
		if (tProps.id) {
			t.topics[tProps.id].select(); // делаем тему в столбце тем активной

			// если тема загружается не вручную кликом по ней - промотать до неё в списке
			// todo - это не работает (и в продакшне тоже) - испортилось после введения пейджинга
			if (!tProps.manual) t.topics[tProps.id].show(false);

			// управляем автопрокруткой
			// Если целевой пост задан в адресе и загружен в теме - проматываем до него
			var refPost = t.address.get('post');

			if (t.posts[refPost]) {

				t.posts[refPost].select();
				t.posts[refPost].show(false);

			} else if (tProps.date_read != 'firstRead') {
				// todo !! тут будет прокрутка до первого непрочитанного поста.
				// Сейчас - прокрутка просто до последнего сообщения в теме, если юзер уже читал эту тему
				t.units.posts.scrollToBottom();
			}
		}

		if (tProps.pglimit_date) t.sync.pglimdateTS = t.funcs.sql2stamp(tProps.pglimit_date);

		t.ui.winResize(); // потому что от размера названия темы может разнести хедер

		// todo разобраться почему работает только через анонимную функцию
		setTimeout(function () {
			this.tinng.units.posts.contentLoaded = 1
		});

//		t.units.posts.setContentLoaded();
	}

	return t.funcs.sql2stamp(result.new_maxdate);
}


tinng.funcs.parser.prototype = {
	tinng:tinng
}
