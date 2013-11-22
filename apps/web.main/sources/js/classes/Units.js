/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:54 PM
 * To change this template use File | Settings | File Templates.
 */

// класс объекта Юнита

tinng.protos.Unit = Class({

	initialize:function (data) {
		this.construct(data);
	},

	construct:function (data) {

		/* СБОР */

		this.data = data;

		this.contentLoaded = 0;

		// todo - переделать под чанки
		var $body = this.$body = t.chunks.get('unit');
		this.$scrollArea = $body.find('.scroll-area');
		this.$contentWrap = $body.find('.content-wrap');
		this.$content = $body.find('.content');
		this.$header = $body.find('header');
		this.$footer = $body.find('footer');

		this.onScroll = $.proxy(this, 'onScroll');

		/* ОБРАБОТКА */

		$body.addClass(data.name);
		$body.css(data.css);

		// todo - переделать систему сбора контролов. Конфигурация через тинг-объект это плохо
		// создание панелей управления
		if (data.header) {
			this.header = new t.protos.ui.Panel(data.header);
			this.$header.append(this.header.$body);
		}

		// привязка событий прокрутки
		this.$scrollArea.on('scroll', this.onScroll);
		this.$scrollArea.scroll();
	},

	setHeight:function (num) {
		var height = num - this.$header.offsetHeight() - this.$footer.offsetHeight();
		this.scrollAreaH = height;
		this.$scrollArea.height(height);
	},

	addNode:function (node) {
		this.$content.append(node.$body);
	},

	addNodeOnTop:function (node) {
		this.$content.prepend(node.$body);
	},

	scrollToTop:function () {
		this.$contentWrap[0].scrollIntoView(true);
	},

	scrollToBottom:function () {
		this.$contentWrap[0].scrollIntoView(false);
	},

	onScroll:function () {
		this.scrolledBy = this.$scrollArea.scrollTop();

		this.atBottom = this.scrollAreaH + this.scrolledBy - this.$contentWrap.offsetHeight() == 0;
		this.atTop = this.scrolledBy == 0;
	},

	clear:function(){
		//todo проверить полное удаление из памяти
		this.$content.children().remove();
		this.stopWaitIndication();
	},

	startWaitIndication:function(){
		this.clear();
		this.$scrollArea.addClass('loading');
	},

	stopWaitIndication:function(){
		this.$scrollArea.removeClass('loading');
	},

	parseFeed:function(feed) {
		console.log('this is only a placeholder for "parseFeed". Feeds are: ', feed)
	}
});


tinng.protos.TopicsUnit = Class(tinng.protos.Unit, {

	construct:function () {
		var that = this;

		t.protos
			.Unit.prototype
			.construct.apply(this, arguments);

		// панель поиска
		this.searchBox = new t.protos.ui.SearchBox({
			placeholder: t.txt.filter_by_tags,
			css:{
				float:'left'
			},
			onConfirm:function(tagSet) {
				that.setFilterQuery(tagSet);
			}
		});
		this.header.$body.prepend(this.searchBox.$body);

		this.newTopic = $.proxy(this, 'newTopic');

		this.header.newTopic.on('click', this.newTopic);

        if (!t.user.hasRight('createTopic')) this.header.newTopic.block();
	},

	newTopic:function () {
		this.header.newTopic.block();
		t.units.posts.newTopic();

		return false;
	},

	addNode:function(node){
		//todo - реализация похожа на node.bump - подумать что с этим можно сделать

		switch (t.sync.topicSort) {

			// сортировка по последнему обновлению
			case 'updated':

				if (t.sync.tsReverse) {
					this.$content.prepend(node.$body);
				} else {
					this.$content.append(node.$body);
				}

				break;
		}

		return false;
	},

	setFilterQuery:function(tagSet){
		var newQuery = [];

		console.log('tagSet: ', tagSet)

		for (var i in tagSet){
			newQuery.push(tagSet[i].id);
		}

		this.clear();

		t.connection.subscribe(this, 'topics', {
			filter: newQuery.join('|')
		});

		//t.sync.filterQuery = newQuery.join('|');
		//console.log('query: ', t.sync.filterQuery)
		//t.rotor.start('load_pages');
	},

	clear:function(){
		t.protos.Unit.prototype['clear'].apply(this, arguments);

		t.topics = {};
	},

	parseFeed:function(feed) {
		if (feed.topics){

			this.stopWaitIndication();

			for (var i in feed.topics) {
				var entry = feed.topics[i];
				var existingTopic = t.topics[entry.id];

				// обрабатываем информацию о непрочитанности

				// Эта логика потребовала размышлений, так что с подробными комментами:
				// если присутсвует последнее сообщение...
				if (entry.last_id) {
					// и юзер - его автор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
					if (parseInt(entry.lastauthor_id,10) == t.user.id) entry.unread = '0';

					// иначе, если есть только первое сообщение и оно было изменено...
				} else if (entry.modifier_id && parseInt(entry.modifier_id,10) > 0) {
					// и юзер - его редактор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
					if (parseInt(entry.modifier_id,10) == t.user.id) entry.unread = '0';

					// иначе (есть только первое неотредактированное сообщение)
				} else {
					// не показываем непрочитанность, если юзер - автор.
					if (parseInt(entry.author_id,10) == t.user.id) entry.unread = '0';
				}
				// todo - внимание! в таком случае своё сообщение _отмечается_ непрочитанным, если юзер отредактировал
				// первое сообщение темы и при этом есть последнее сообщение, которое написал не он, даже если оно уже прочитано
				// при этом снять "непрочитанность" с такой темы невозможно, так как в ленте сообщений отсутствуют
				// "непрочитанные" посты, по наведению на которые снимается непрочитанность

				// если в текущем массиве загруженных тем такая уже есть - обновляем существующую
				if (existingTopic) {

					if (entry.deleted) {

						existingTopic.remove('fast');
						//if (entry.id == t.sync.curTopic) t.funcs.unloadTopic();
						delete(existingTopic);

					} else {
						existingTopic.fill(entry);
						existingTopic.bump();
					}

					// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
				} else if (!entry.deleted) {

					var topic = t.topics[entry.id] = new t.protos.TopicNode(entry);
					this.addNode(topic);
					//if (tProps['new']) topic.loadPosts();
					//ifblur_notify('New Topic: '+entry.topic_name, entry.message);
				}
			}

			this.contentLoaded = 1;
		}
	}
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

tinng.protos.PostsUnit = Class(tinng.protos.Unit, {

	construct:function () {

		t.protos.Unit.prototype
			.construct.apply(this, arguments);

		this.newTopicMode = false;

		this.topicRename = $.proxy(this, 'topicRename');
		this.enterRenameMode = $.proxy(this, 'enterRenameMode');
		this.cancelRename = $.proxy(this, 'cancelRename');
		this.saveName = $.proxy(this, 'saveName');
		this.cancelNewTopic = $.proxy(this, 'cancelNewTopic');

        // прячем ненужные пока контролы
		this.header.save.hide();
		this.header.cancel.hide();
		this.header.cancelNewTopic.hide();

        // расстановка событий
		this.header.topicRename.on('click', this.topicRename);
		this.header.cancel.on('click', this.cancelRename);
		this.header.save.on('click', this.saveName);
		this.header.cancelNewTopic.on('click', this.cancelNewTopic);

        // проверка прав
		this.header.topicRename.hide();

		this.$showMore = $('<div class="showmore"/>');
		this.$contentWrap.prepend(this.$showMore);

		var showNext = $('<a>' + t.txt.show_more + '</a>');
		var showAll = $('<a>' + t.txt.show_all + '</a>');

		this.showNext = $.proxy(this, 'showNext');
		this.showAll = $.proxy(this, 'showAll');
		showNext.click(this.showNext);
		showAll.click(this.showAll);

		this.$showMore.append(showNext, showAll);
	},

	addNode:function (node) {

		var posts = this.$content.children();

		if (posts.size()) for (var i = 0; i < posts.length; i++) {
			var $post = $(posts[i]);
			if (node.id < parseInt($post.attr('data-number'))) {
				node.$body.insertBefore($post);
				return;
			}
		}

		t.protos
			.Unit.prototype
			.addNode.call(this, node);
	},

	setInvitation:function(){
		this.clear();
		this.$content.append(t.chunks.get('posts-default'));
	},

	/*startWaitIndication:function(){
		this.clear();
		this.$scrollArea.addClass('loading');
	},*/

	onScroll:function () {

		t.protos
			.Unit.prototype
			.onScroll.apply(this, arguments);

		if (this.contentLoaded) {
			if (this.atTop) {
//				t.funcs.loadMore(t.sync.plimit+1);
//				console.log('top reached');
			}

			if (this.atBottom) {
//				console.log('bottom reached')
			}
		}
	},

	showNext:function () {
		t.funcs.loadMore(t.sync.plimit + 1);
	},

	showAll:function () {
		t.funcs.loadMore(0);
	},

	topicRename:function () {
		JsHttpRequest.query('backend/service.php', { // аргументы:
			action:'check_n_lock',
			id:t.sync.curTopic
		}, this.enterRenameMode, true);

		return false;
	},

	enterRenameMode:function (result, errors) {

		if (result.locked !== null) {

			if (t.state.userID == '1') {
				if (confirm(t.txt.post_locked + '\n' + t.txt.post_locked_admin)) {
					this.unlock()
				} else {
					this.mainPanel.unlock.$body.show();
				}
			} else alert(t.txt.post_locked);

		} else {

			this.header.topicRename.hide();

			this.nameBackup = this.header.topicName.$body.html();
			this.header.save.show();
			this.header.cancel.show();


			this.header.topicName.$body.attr('contenteditable', true);
			this.header.topicName.$body.focus();
		}
	},

	exitRenameMode:function () {
		this.header.topicRename.show();
		this.header.save.hide();
		this.header.cancel.hide();

		this.header.topicName.$body.removeAttr('contenteditable');
	},

	cancelRename:function () {

		this.exitRenameMode();
		this.unlock();
		this.header.topicName.$body.html(this.nameBackup);
		this.nameBackup = '';

		return false;
	},

	saveName:function () {

		t.rotor.start('update_message', {
			id:t.sync.curTopic,
			topic_name:this.header.topicName.$body.html()
		});

		this.exitRenameMode();

		return false; // preventDefault + stopPropagation
	},

	unlock:function () {
		JsHttpRequest.query('backend/service.php', { // аргументы:
			action:'unlock_message',
			id:t.sync.curTopic
		}, function () {
		}, true);

//		this.mainPanel.unlock.$body.hide();

		return false; // preventDefault + stopPropagation
	},

	newTopic:function () {

		t.funcs.unloadTopic();

		this.header.topicRename.hide();
		this.header.cancelNewTopic.show();
		this.$showMore.hide();
		this.header.topicName.$body.html('');
		this.header.topicName.$body.attr('contenteditable', true);
        this.header.topicName.$body.focus();

		this.newTopicMode = true;

		return false;
	},

	exitNewTopicMode:function(){
		this.header.topicRename.show();
		this.header.cancelNewTopic.hide();
		this.header.topicName.$body.removeAttr('contenteditable');
		t.units.topics.header.newTopic.unblock();

		this.newTopicMode = false;
	},

	cancelNewTopic:function(){

		t.funcs.unloadTopic();
		this.header.topicName.$body.html('');
		this.exitNewTopicMode();

		return false;
	},

	setTopicName:function(name){
		this.header.topicName.$body.html(name)
	},

	parseFeed:function(feed) {

		// разбираем посты
		if (feed.posts) {

			// наличие id означает что тема загружается в первый раз, а не догружается.
			// todo - исправить фиговое опредление!
			/*if (tProps.id) {
				t.units.posts.clear();
			}*/

			// управление отображением догрузочных кнопок
			/*if (tProps.show_all) {
				t.units.posts.$showMore.hide();
			} else if (actionUsed == 'next_page' || actionUsed == 'load_pages') {
				t.units.posts.$showMore.show();
			}*/

			// если страница догружалась
			/*if (actionUsed == 'next_page') {
				var rememberTop = t.units.posts.$content.children()[0];
				var more_height = t.units.posts.$showMore.offsetHeight();
				//console.log('moreH=' + more_height);
			}*/

			for (var i in feed.posts) {
				var postData = feed.posts[i];
				var existingPost = t.posts[postData.id];

				// обрабатываем информацию о непрочитанности
				var modifier = parseInt(postData.modifier_id,10);
				var author = parseInt(postData.author_id,10);

				// если сообщение было изменено и юзер - его редактор - не показывать непрочитанным, кем бы не был создатель
				if (!isNaN(modifier) && modifier > 0) {
					if (modifier == t.user.id) postData.unread = '0';
				} else if (author == t.user.id) {
					// если сообщение не редактировалось - не показываем непрочитанность, если юзер - автор
					 postData.unread = '0';
				}

				if (existingPost) {
				// если в текущем массиве загруженных сообщений такое уже есть

					if (postData.deleted) existingPost.remove();
					else existingPost.fill(postData);

				} else if (!postData.deleted) {
				// если в текущем массиве такого нет и пришедшее не удалено

					var newPost = t.posts[postData.id] = new t.protos.PostNode(postData);
					this.addNode(newPost);
				}
			}



			/*if (actionUsed == 'next_page') {
				rememberTop.scrollIntoView(true);
				//console.log(t.units.posts.$scrollArea.scrollTop())
				t.units.posts.$scrollArea.scrollTop(t.units.posts.$scrollArea.scrollTop() - more_height - 3);
			} // todo - неправильно прокручивается, если до догрузки все сообщения помещались и прокрутка не появлялась*/

			// наличие id означает что тема загружается в первый раз, а не догружается.
			// todo - исправить фиговое опредление!
			/*if (tProps.id) {

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
			}*/

			// это вроде уже не надо
			//if (tProps.pglimit_date) t.sync.pglimdateTS = t.funcs.sql2stamp(tProps.pglimit_date);

			// todo разобраться почему работает только через анонимную функцию
			setTimeout(function () {
				this.contentLoaded = 1
			});

			//this.setContentLoaded();
		}

		if (feed.topic_data) {

			var topic = feed.topic_data;

			this.setTopicName(topic.topic_name); //вывод названия темы

			// todo - если введем автовысоту через css - убрать
			t.ui.winResize(); // потому что от размера названия темы может разнести хедер

			// todo - в будущем тут будет проверка на наличие модулей, подписанных на список тем
			if (t.topics && t.topics[topic.id]) {

				// если тема есть, но она не выделена - значит тема грузилась не кликом по ней
				if (!t.topics[topic.id].isSelected()) {
					t.topics[topic.id].select(); // сделать актвной
					t.topics[topic.id].show(false); // промотать до нее
				}
			}

			//if (tProps.scrollto) t.posts[tProps.scrollto].show(false);
		}
	}
});

