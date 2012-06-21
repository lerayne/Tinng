/**
 * Created by JetBrains PhpStorm.
 * User: Lerayne
 * Date: 28.04.12
 * Time: 18:55
 * To change this template use File | Settings | File Templates.
 */

/* ОСНОВНОЙ ДВИЖОК ОБНОВЛЕНИЯ */

tinng.protos.Rotor = function (backendURL, syncCollection, parseCallback) {
	var t = this.tinng;

	this.backendURL = backendURL;
	this.syncCollection = syncCollection; //TODO придумать, как передавать параметры, чтобы ротор был более независимым
	this.parseCallback = parseCallback;

	this.waitTime = t.state.blurred ? t.cfg['poll_timer_blurred'] : t.cfg['poll_timer'];
	this.request = false; // запрос
	this.timeout = false; // текущий таймаут

	this.$stateIndicator = $('.state-ind');

	// проксирование функций
	this.start = $.proxy(this, 'start');
	this.stop = $.proxy(this, 'stop');
	this.onResponse = $.proxy(this, 'onResponse');
	this.onAbort = $.proxy(this, 'onAbort');
}

tinng.protos.Rotor.prototype = {
	tinng:tinng,

	// главная функция ротора
	start:function (action, params) {
		var t = this.tinng;

		// параметры, которые должны не сохраняться, а задаваться каждый раз из аргументов
		t.sync.action = action ? action : '';
		t.sync.params = params ? params : {};
		this.action = t.sync.action;

		// останавливаем предыдущий запрос/таймер если находим
		if (this.request || this.timeout) this.stop();

		this.startIndication(); // показываем, что запрос начался

		// Отправляем запрос
		this.request = new JsHttpRequest();
		this.request.onreadystatechange = this.onResponse;
		this.request.open(null, this.backendURL, true);
		this.request.send(this.syncCollection);

		t.funcs.log('Launching query with timeout ' + this.waitTime);
	},

	// Останавливает ротор
	stop:function () {
		var t = this.tinng;

		this.timeout = t.funcs.advClearTimeout(this.timeout);

		if (this.request) {
			// переопределяем, иначе rotor воспринимает экстренную остановку как полноценное завершение запроса
			this.request.onreadystatechange = this.onAbort;
			this.request.abort();
			this.request = false;

			t.funcs.log('STOP occured while WAITING. Query has been ABORTED');
		}
	},

	// Выполняется при удачном возвращении запроса
	onResponse:function () {
		var t = this.tinng;

		if (this.request.readyState == 4) {

			// разбираем пришедший пакет и выполняем обновления
			t.sync.maxdateTS = this.parseCallback(this.request.responseJS, this.action, t);

			this.stopIndication(); // индикация ожидания откл
			this.request = false;
			this.timeout = setTimeout(this.start, this.waitTime);
		}
	},

	// Выполняется при принудительном сбросе запроса
	onAbort:function () {
		this.stopIndication();
	},

	// изменение времени ожидания
	changeTimeout:function (msec) {
		this.waitTime = msec;
		this.start();
	},

	// как-то отмечаем в интерфейсе что запрос ушел
	startIndication:function () {
		this.$stateIndicator.addClass('updating');
	},

	// как-то отмечаем в интерфейсе что запрос закончен
	stopIndication:function () {
		this.$stateIndicator.removeClass('updating');
	}
}
/* end of Rotor */



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
		}

		for (var i in result.posts) {
			entry = result.posts[i];
			post = t.posts[entry.id];

			if (post) { // если в текущем массиве загруженных сообщений такое уже есть

				if (entry.deleted) {

					post.remove();
					delete(post); //todo - проверить, удаляется ли сам элемент массива
					t.funcs.postSelect(false);

				} else post.fill(entry);

			} else if (!entry.deleted) { // если в текущем массиве такого нет и пришедшее не удалено

				var parent = t.sync.curTopic;

				post = t.posts[entry.id] = new t.protos.PostNode(entry);
				t.units.posts.addNode(post);

				var lastvisible = post;
			}
		}

		//if (tProps.show_all) hide(e('@show_more')); //todo - это для догрузки

		if (tProps.scrollto) t.posts[tProps.scrollto].show(false);
		if (actionUsed == 'next_page') {
			rememberTop.scrollIntoView(true);
			t.units.posts.$scrollArea.scrollTop(t.units.posts.$scrollArea.scrollTop() - more_height - 3);
		}

		// наличие id означает что тема загружается в первый раз, а не догружается.
		// todo - исправить фиговое опредление!
		if (tProps.id) {
			t.topics[tProps.id].markActive(); // делаем тему в столбце тем активной

			// если тема загружается не вручную кликом по ней - промотать до неё в списке
			// todo - это не работает (и в продакшне тоже) - испортилось после введения пейджинга
			if (!tProps.manual) t.topics[tProps.id].show(false);

			// управляем автопрокруткой
			// Если целевой пост задан в адресе и загружен в теме - проматываем до него
			var refPost = t.address.get('post');

			if (t.posts[refPost]) {

				t.posts[refPost].show(false); // todo - фигово работает промотка с выравниванием по низу - эдитор закрывает
				t.posts[refPost].select()

			} else if (tProps.date_read != 'firstRead') {
				// todo !! тут будет прокрутка до первого непрочитанного поста. Сейчас - прокрутка просто до последнего сообщения в теме, если юзер уже читал эту тему
				lastvisible.show(true);
			}
		}

		if (tProps.pglimit_date) t.sync.pglimdateTS = t.funcs.sql2stamp(tProps.pglimit_date);

		// todo разобраться почему работает только через анонимную функцию
		setTimeout(function(){this.tinng.units.posts.contentLoaded = 1}, 0);
//		t.units.posts.setContentLoaded();
	}

	return t.funcs.sql2stamp(result.new_maxdate);
}


tinng.funcs.parser.prototype = {
	tinng:tinng
}
/* end of parser */



/* КЛАСС ТЕГА */

tinng.protos.Tag = function (data) {
	var t = this.tinng;

	this.$body = t.chunks.get('tag');
	this.$body.text(data.name);
}

tinng.protos.Tag.prototype = {
	tinng:tinng
}
/* end of Tag */



/* КЛАССЫ НОДЫ, ТЕМЫ И ПОСТА */

tinng.protos.Node = new Class({
	tinng:tinng,

	initialize:function (data, chunkName, addCells) {
		this.construct(data, chunkName, addCells);
		this.fill(data);
	},

	construct:function (data, chunkName, addCells) {
		var t = this.tinng;

		this.$body = t.chunks.get(chunkName || 'node');

		// создаем поля главного объекта на основе данных
		this.data = data;
		this.id = parseInt(data.id);

		// заполняем коллекцию cells на основе названий полей
		var cells = [

			'created',
			'author',
			'id',
			'message',
			'controls'

		].concat(addCells || []);

		this.cells = {};
		for (var i in cells) this.cells['$' + cells[i]] = this.$body.find('[data-cell="' + cells[i] + '"]');

		// заполняем неизменные данные, присваеваемые единожды
		this.$body.attr('id', chunkName + '_' + data.id);
		this.$body.attr('data-number', data.id);
		this.cells.$message.addClass('message_' + data.id);
		this.cells.$id.text(data.id);
	},

	// заполнить данными
	fill:function (data) {
		var t = this.tinng;

		this.data = data;

		// общие поля
		this.cells.$message.html(data.message);
		this.cells.$created.text(data.modified ? t.txt.modified + data.modified : data.created);
		this.cells.$author.text(data.author);
	},

	remove:function (speed) {

		if (speed) {
			//todo: дописать анимацию
//		$(elem).addClass('transp');
//		setTimeout(function() {remove(elem)}, 500);
		}

		this.$body.remove();
	},

	show:function (start) {
		this.$body[0].scrollIntoView(start)
	}
});


tinng.protos.TopicNode = new Class(tinng.protos.Node, {

	construct:function (data) {

		this.tinng.protos
			.Node.prototype
			.construct.call(this, data, 'topic',
			[
				'tags',
				'lastmessage',
				'topicname',
				'postsquant'
			]
		);

		// проксирование функций
		this.loadPosts = $.proxy(this, 'loadPosts');

		// вешаем обработчики событий
		this.$body.on('click', this.loadPosts);
	},

	// заполнить данными
	fill:function (data) {
		var t = this.tinng;

		t.protos
			.Node.prototype
			.fill.apply(this, arguments);

		this.cells.$postsquant.text(data.postsquant + t.txt.msgs);
		this.cells.$topicname.html(data.topic_name);

		// последнее сообщение
		if (data.last_id) {
			this.cells.$lastmessage.html(
				'<div>' + t.txt.lastpost + '<b>' + data.lastauthor + '</b> (' + data.lastdate + ') ' + data.lastpost + '</div>'
			);
		}

		// вбиваем теги
		//todo: сейчас теги при каждом филле обнуляются и вбиваются заново. непорядок
		if (data.tags) {
			this.cells.$tags.text('');
			for (var i in data.tags) {
				this.cells.$tags.append(new t.protos.Tag(data.tags[i]).$body);
			}
		}
	},

	// изменить положение в списке при обновлении
	bump:function () {
		var t = this.tinng;
		var topics = t.units.topics;

		switch (t.sync.topicSort) {

			// сортировка по последнему обновлению
			case 'updated':
				this.remove(0);

				if (t.sync.tsReverse) {
					topics.addNodeOnTop(this)
				} else {
					topics.addNode(this);
				}

				break;
		}
	},

	// загрузить тему
	loadPosts:function () {
		var t = this.tinng;

		t.funcs.unloadTopic();
		this.markActive(); // делаем тему в столбце тем активной

		t.sync.curTopic = this.id;
		t.rotor.start('load_pages');

		t.address.set({topic: this.id, plimit:t.sync.plimit});
	},

	markActive:function () {
		this.unmarkActive();
		this.$body.addClass('active');
	},

	unmarkActive:function(){
		this.tinng.funcs.topicUnmarkActive();
	}
});


tinng.protos.PostNode = Class(tinng.protos.Node, {

	construct:function (data) {

		this.tinng.protos
			.Node.prototype
			.construct.call(this, data, 'post',
			[
				'avatar'
			]
		);

		this.onClick = $.proxy(this, 'onClick');
		this.$body.click(this.onClick);
	},

	fill:function (data) {
		this.tinng.protos
			.Node.prototype
			.fill.apply(this, arguments);

		this.cells.$avatar.attr('src', data.avatar_url);
	},

	onClick:function () {
		this.select();
	},

	select:function () {
		var t = this.tinng;

		var selected = t.state.selectedPost;

		if (!selected || selected.id != this.id) {
			if (selected) selected.deselect();

			t.state.selectedPost = this;
			this.$body.addClass('selected');
			t.address.set('post', this.id);
		} else if (selected.id == this.id) {
			this.deselect('full');
		}
	},

	deselect:function (full) {
		this.$body.removeClass('selected');

		// если после этого сразу будет новое выделение
		if (full) {
			delete(this.tinng.state.selectedPost);
			this.tinng.address.del('post');
		}
	}
})
/* end of TopicNode */



/* функция выгрузки темы */
tinng.funcs.unloadTopic = function () {
	var t = this.tinng;

	if (t.state.selectedPost) t.state.selectedPost.deselect('full');
	t.units.posts.$content.html(''); //todo проверить полное удаление из памяти
	t.posts = {};
	t.sync.curTopic = 0;
	t.sync.pglimdateTS = 0;
	t.sync.plimit = 1;
	t.units.posts.contentLoaded = 0;
}


tinng.funcs.topicUnmarkActive = function () {
	$('.topics .active').removeClass('active');
}


//todo - переписать под тинг
tinng.funcs.postSelect = function (id) {
	var current = e('@selected', '#viewport_posts');
	if (current) {
		// если мы клацнули по уже выделенному посту - ничего не делаем, выходим из функции
		if (current.id == 'post_' + id) return;
		// иначе снимаем выделение с текущего и идем дальше
		removeClass(current, 'selected');
	}

	/*if (selectedPost && answerForm.field.innerHTML == selectedPost.row.author+', ')
	 answerForm.field.innerHTML = '<br>';*/

	// передача строго false в качестве параметра просто снимает старое выделение, но не назначает новое
	if (id === false) {
		selectedPost = false;
		//answerForm.hideAdvice();
		t.address.del('post');
		return;
	}

	var newone = e('#post_' + id, '#viewport_posts');

	if (!newone) {
		//adress.set('plimit', postsPageLimit++);
		rotor.start('next_page', {directMsg:id});
		newone = e('#post_' + id, '#viewport_posts');
	}

	if (newone) {
		//console.warn(id);
		addClass(newone, 'selected');
		selectedPost = messages[id];
		//answerForm.showAdvice(id);
		//if (answerForm.field.innerHTML == '<br>') answerForm.field.innerHTML = selectedPost.row.author+', ';
	} else {
		selectedPost = false; // на случай, если передан несуществующий новый id
		//answerForm.hideAdvice();
	}

	return;
}