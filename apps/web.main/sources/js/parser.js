/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 4:43 PM
 * To change this template use File | Settings | File Templates.
 */

/* ФУНКЦИЯ РАЗБОРА ДАННЫХ ОБ ИЗМЕНЕНИИ */

tinng.funcs.parser = function (result, actionUsed) {

	if (!result) return false;

//	console.log('actionUsed: ', actionUsed)

	if (result && result.error) alert(t.txt.post_locked);

	var tProps = (result && result.topic_prop) ? result.topic_prop : [];

	var i, post;

    // общие действия - до разбора тем и постов
    if (actionUsed == 'add_topic') {
//        console.log('exitNewTopicMode')
        t.units.posts.exitNewTopicMode();
    }

	// разбираем темы
	if (result && result.topics) {

		t.units.topics.stopWaitIndication();

		for (i in result.topics) {
			var entry = result.topics[i];
			var existingTopic = t.topics[entry.id];

			// обрабатываем информацию о непрочитанности

			// todo - темы, в которые юзер ни разу не заходил не отмечаются непрочитанными. Придумать что с ними делать

			// Эта логика потребовала размышлений, так что с подробными комментами:
			// если присутсвует последнее сообщение...
			if (entry.last_id) {
				// и юзер - его автор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
				if (parseInt(entry.lastauthor_id,10) == t.user.id) entry.unread = '0';
			// иначе если первое сообщение было изменено...
			} else if (entry.modifier_id && parseInt(entry.modifier_id,10) > 0) {
				// и юзер - его редактор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
				if (parseInt(entry.modifier_id,10) == t.user.id) entry.unread = '0';
			// иначе - подразумеваем что есть толкьо первое неотредактированное сообщение...
			} else {
				// и само собой - не показываем непрочитанность, если юзер - автор.
				if (parseInt(entry.author_id,10) == t.user.id) entry.unread = '0';
			}

			// если в текущем массиве загруженных тем такая уже есть - обновляем существующую
			if (existingTopic) {

				if (entry.deleted) {

					existingTopic.remove('fast');
					if (entry.id == t.sync.curTopic) t.funcs.unloadTopic();
					delete(existingTopic);

				} else {
					existingTopic.fill(entry);
					existingTopic.bump();
				}

				// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
			} else if (!entry.deleted) {

				var topic = t.topics[entry.id] = new t.protos.TopicNode(entry);
				t.units.topics.addNode(topic);
				if (tProps['new']) topic.loadPosts();
				//ifblur_notify('New Topic: '+entry.topic_name, entry.message);
			}
		}

		t.units.topics.contentLoaded = 1;
	}

	// разбираем посты
	if (result && result.posts) {

		// наличие id означает что тема загружается в первый раз, а не догружается.
		// todo - исправить фиговое опредление!
		if (tProps.id) {
			t.units.posts.clear();
		}

		t.units.posts.setTopicName(tProps.name); //вывод названия темы

		// управление отображением догрузочных кнопок
		if (tProps.show_all) {
			t.units.posts.$showMore.hide();
		} else if (actionUsed == 'next_page' || actionUsed == 'load_pages') {
			t.units.posts.$showMore.show();
		}

		// если страница догружалась
		if (actionUsed == 'next_page') {
			var rememberTop = t.units.posts.$content.children()[0];
			var more_height = t.units.posts.$showMore.offsetHeight();
//			console.log('moreH=' + more_height);
		}

		for (var i in result.posts) {
			var entry = result.posts[i];
			var post = t.posts[entry.id];

			// обрабатываем информацию о непрочитанности

			// Эта логика потребовала размышлений, так что с подробными комментами:
			// если сообщение было изменено...
			if (entry.modifier_id && parseInt(entry.modifier_id,10) > 0) {
				// и юзер - его редактор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
				if (parseInt(entry.modifier_id,10) == t.user.id) entry.unread = '0';
				// иначе - подразумеваем что есть только неотредактированное сообщение...
			} else {
				// и само собой - не показываем непрочитанность, если юзер - автор.
				if (parseInt(entry.author_id,10) == t.user.id) entry.unread = '0';
			}

			if (post) { // если в текущем массиве загруженных сообщений такое уже есть

				if (entry.deleted) {

					post.remove();

				} else post.fill(entry);

			} else if (!entry.deleted) { // если в текущем массиве такого нет и пришедшее не удалено

				var post = t.posts[entry.id] = new t.protos.PostNode(entry);
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
			t.units.posts.contentLoaded = 1
		});

//		t.units.posts.setContentLoaded();
	}

	return t.funcs.sql2stamp(result.new_maxdate);
}


tinng.funcs.parser.prototype = {

}
