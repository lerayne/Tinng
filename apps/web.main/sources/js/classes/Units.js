/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:54 PM
 * To change this template use File | Settings | File Templates.
 */

// класс объекта Юнита

tinng.protos.Unit = Class({

	initialize: function (data) {
		this.construct(data);
	},

	construct: function (data) {

		/* СБОР */

		this.data = data;

		this.contentLoaded = 0;

		this.subscriptions = {};

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

	setHeight: function (num) {
		var height = num - this.$header.offsetHeight() - this.$footer.offsetHeight();
		this.scrollAreaH = height;
		this.$scrollArea.height(height);
	},

	addNode: function (node) {
		this.$content.append(node.$body);
	},

	addNodeOnTop: function (node) {
		this.$content.prepend(node.$body);
	},

	scrollToTop: function () {
		this.$contentWrap[0].scrollIntoView(true);
	},

	scrollToBottom: function () {
		//console.log('scroll to bottom');
		this.$contentWrap[0].scrollIntoView(false);
	},

	onScroll: function () {
		this.scrolledBy = this.$scrollArea.scrollTop();

		this.atBottom = this.scrollAreaH + this.scrolledBy - this.$contentWrap.offsetHeight() >= 0;
		this.atTop = this.scrolledBy == 0;
	},

	clear: function () {
		//todo проверить полное удаление из памяти
		this.$content.children().remove();
		this.stopWaitIndication();
	},

	isClear: function () {
		return !this.$content.children().size();
	},

	startWaitIndication: function () {
		this.clear();
		this.$scrollArea.addClass('loading');
	},

	stopWaitIndication: function () {
		this.$scrollArea.removeClass('loading');
	},

	parseFeed: function (feed) {
		console.log('this is only a placeholder for "parseFeed". Feeds are: ', feed)
	}
});


tinng.protos.TopicsUnit = Class(tinng.protos.Unit, {

	construct: function () {
		var that = this;
		t.funcs.bind(this, ['newTopic'])

		t.protos
			.Unit.prototype
			.construct.apply(this, arguments);

		// панель поиска
		this.createSearchBox();

		this.header.newTopic.on('click', this.newTopic);

		if (!t.user.hasRight('createTopic')) this.header.newTopic.block();
	},

	createSearchBox:function(){
		var that = this;

		var searchBoxParams = {
			placeholder: t.txt.filter_by_tags,
			css: {
				float: 'left'
			},
			onConfirm: function (tagSet) {
				that.setFilterQuery(tagSet);
			}
		}

		if (t.address.get('search')) {

			JsHttpRequest.query(
				'./backend/service.php',
				{
					action:'get_tags',
					tags:t.address.get('search')
				}, function(result, errors){

					console.log('createSearchBox:', result)

					var tags = [];
					for (var i = 0; i < result.length; i++) {
						tags.push(result[i].name);
					}

					searchBoxParams.tags = tags;
					that.searchBox = new t.protos.ui.SearchBox(searchBoxParams);
					that.header.$body.prepend(that.searchBox.$body);
				}
			);

		} else {
			this.searchBox = new t.protos.ui.SearchBox(searchBoxParams);
			this.header.$body.prepend(this.searchBox.$body);
		}
	},

	newTopic: function () {
		this.header.newTopic.block();
		t.units.posts.newTopic();

		return false;
	},

	addNode: function (node) {
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

	setFilterQuery: function (tagSet) {
		this.clear();

		var searchString = tagSet.join('|');

		t.connection.subscribe(this, 'topics', {
			filter: searchString
		});

		if (searchString) {
			t.address.set('search', searchString);
		} else {
			t.address.del('search');
		}
	},

	clear: function () {
		t.protos.Unit.prototype['clear'].apply(this, arguments);

		t.topics = {};
	},

	isClear: function () {
		return t.funcs.isEmptyObject(t.topics);
	},

	parseFeed: function (feed, actionsUsed) {
		this.stopWaitIndication();

		//console.log('actionsUsed (topics parser):', actionsUsed);

		if (feed.topics) this.parseTopics(feed.topics);
	},

	parseTopics: function (topicsList) {

		for (var i in topicsList) {
			var topicData = topicsList[i];
			var existingTopic = t.topics[topicData.id];

			// обрабатываем информацию о непрочитанности

			// Эта логика потребовала размышлений, так что с подробными комментами:
			// если присутсвует последнее сообщение...
			if (topicData.last_id) {
				// и юзер - его автор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
				if (parseInt(topicData.lastauthor_id, 10) == t.user.id) topicData.unread = '0';

				// иначе, если есть только первое сообщение и оно было изменено...
			} else if (topicData.modifier_id && parseInt(topicData.modifier_id, 10) > 0) {
				// и юзер - его редактор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
				if (parseInt(topicData.modifier_id, 10) == t.user.id) topicData.unread = '0';

				// иначе (есть только первое неотредактированное сообщение)
			} else {
				// не показываем непрочитанность, если юзер - автор.
				if (parseInt(topicData.author_id, 10) == t.user.id) topicData.unread = '0';
			}
			// todo - внимание! в таком случае своё сообщение _отмечается_ непрочитанным, если юзер отредактировал
			// первое сообщение темы и при этом есть последнее сообщение, которое написал не он, даже если оно уже прочитано
			// при этом снять "непрочитанность" с такой темы невозможно, так как в ленте сообщений отсутствуют
			// "непрочитанные" посты, по наведению на которые снимается непрочитанность

			// если в текущем массиве загруженных тем такая уже есть - обновляем существующую
			if (existingTopic) {

				if (topicData.deleted) {

					existingTopic.remove('fast');
					//if (topicData.id == t.sync.curTopic) t.funcs.unloadTopic();
					delete(existingTopic);

				} else {
					existingTopic.fill(topicData);
					existingTopic.bump();
				}

				// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
			} else if (!topicData.deleted) {

				var topic = t.topics[topicData.id] = new t.protos.TopicNode(topicData);
				this.addNode(topic);
				//if (tProps['new']) topic.loadPosts();
				//ifblur_notify('New Topic: '+topicData.topic_name, topicData.message);
			}
		}

		this.contentLoaded = 1;
	}
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

tinng.protos.PostsUnit = Class(tinng.protos.Unit, {

	construct: function () {

		t.funcs.bind(this, [
			'topicRename',
			'enterRenameMode',
			'cancelRename',
			'saveName',
			'cancelNewTopic',
			'showNext',
			'showAll'
		]);

		t.protos.Unit.prototype
			.construct.apply(this, arguments);

		this.newTopicMode = false;

		// прячем ненужные пока контролы
		this.header.save.hide();
		this.header.cancel.hide();
		//this.header.cancelNewTopic.hide();

		// расстановка событий
		this.header.topicRename.on('click', this.topicRename);
		this.header.cancel.on('click', this.cancelRename);
		this.header.save.on('click', this.saveName);
		//this.header.cancelNewTopic.on('click', this.cancelNewTopic);

		// проверка прав
		this.header.topicRename.hide();

		this.$showMore = $('<div class="showmore"/>');
		this.$contentWrap.prepend(this.$showMore);

		var showNext = $('<a>' + t.txt.show_more + '</a>');
		var showAll = $('<a>' + t.txt.show_all + '</a>');

		showNext.click(this.showNext);
		showAll.click(this.showAll);

		this.$showMore.append(showNext, showAll);
	},

	addNode: function (node) {

		var posts = this.$content.children();

		// если id поста меньше, чем id одного из уже загруженных - вставляем раньше ...
		if (posts.size()) for (var i = 0; i < posts.length; i++) {
			var $post = $(posts[i]);
			if (node.id < parseInt($post.attr('data-number'))) {
				node.$body.insertBefore($post);
				// .. и завершаем работу метода
				return true;
			}
		}

		// если не завеошили выше - пользуемся дефолтом из класса-предка
		t.protos.Unit.prototype['addNode'].call(this, node);
	},

	clear: function () {
		t.protos.Unit.prototype['clear'].apply(this, arguments);

		this.$showMore.hide();
		t.posts = {};
	},

	isClear: function () {
		return t.funcs.isEmptyObject(t.posts);
	},

	setInvitation: function () {
		this.clear();
		this.$content.append(t.chunks.get('posts-default'));
	},

	/*startWaitIndication:function(){
	 this.clear();
	 this.$scrollArea.addClass('loading');
	 },*/

	onScroll: function () {

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

	showNext: function () {
		this.loadMore(t.funcs.objectSize(t.posts) + t.cfg.posts_per_page);
	},

	showAll: function () {
		this.loadMore(0);
	},

	loadMore: function(newLimit){
		t.address.set('plimit', newLimit)
		t.connection.rescribe(this, 'posts', {
			limit: newLimit
		})
	},

	topicRename: function () {
		JsHttpRequest.query('backend/service.php', { // аргументы:
			action: 'check_n_lock',
			id: t.sync.curTopic
		}, this.enterRenameMode, true);

		return false;
	},

	enterRenameMode: function (result, errors) {

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

	exitRenameMode: function () {
		this.header.topicRename.show();
		this.header.save.hide();
		this.header.cancel.hide();

		this.header.topicName.$body.removeAttr('contenteditable');
	},

	cancelRename: function () {

		this.exitRenameMode();
		this.unlock();
		this.header.topicName.$body.html(this.nameBackup);
		this.nameBackup = '';

		return false;
	},

	saveName: function () {

		t.connection.write({
			action:'update_message',
			id: this.subscriptions['posts'].topic,
			topic_name: this.header.topicName.$body.html()
		});

		this.exitRenameMode();

		return false; // preventDefault + stopPropagation
	},

	unlock: function () {
		JsHttpRequest.query('backend/service.php', { // аргументы:
			action: 'unlock_message',
			id: t.sync.curTopic
		}, function () {
		}, true);

//		this.mainPanel.unlock.$body.hide();

		return false; // preventDefault + stopPropagation
	},

	newTopic: function () {

		t.funcs.unloadTopic();

		this.header.topicRename.hide();
		//this.header.cancelNewTopic.show();
		this.$showMore.hide();

		this.header.topicName.$body.html(t.txt.new_topic_creation);
		//this.header.topicName.$body.attr('contenteditable', true);
		//this.header.topicName.$body.focus();

		this.addNode(this.createTopicEditNode())

		this.newTopicMode = true;

		return false;
	},

	createTopicEditNode:function(topic){
		var that = this;

		var node = t.chunks.get('topic-edit');

		var title = node.find('[data-cell="input_title"]');
		var body = node.find('[data-cell="input_body"]');
		var save = node.find('[data-cell="button_save"]');
		var cancel = node.find('[data-cell="button_cancel"]');
		var tagbox = node.find('[data-cell="tagbox"]');

		cancel.click(this.cancelNewTopic);

		var searchBoxParams = {
			placeholder: t.txt.enter_tags,
			tagsOnly:true,
			onConfirm: function (tagSet) {
				console.log('addTags:', tagSet)
			}
		}

		if (typeof topic == 'undefined') {
			save.val(t.txt.new_topic_btn_create);

			this.searchBox = new t.protos.ui.SearchBox(searchBoxParams);
			tagbox.append(this.searchBox.$body);
		}

		return {$body: node};
	},

	exitNewTopicMode: function () {
		this.header.topicRename.show();
		//this.header.cancelNewTopic.hide();
		this.header.topicName.$body.removeAttr('contenteditable').html('');
		t.units.topics.header.newTopic.unblock();

		this.newTopicMode = false;
	},

	cancelNewTopic: function () {

		// todo - убрать эту хрень с unloadTopic и разобраться в алгоритмах загрузки и выгрузки, подписки-отписки
		t.funcs.unloadTopic();
		this.exitNewTopicMode();

		return false;
	},

	setTopicName: function (name) {
		this.header.topicName.$body.html(name)
	},

	unscribe:function(){
		// отписываемся от старой темы
		t.connection.unscribe(this, 'posts');
		t.connection.unscribe(this, 'topic_data');

		t.address.del('topic');
		t.address.del('plimit');
		t.address.del('post');

		this.clear();
		// todo - заменить на единую функцию инициализации интерфейса
		this.exitNewTopicMode();
		this.exitRenameMode();
	},

	subscribe:function(id, limit){

		// подписываемся на новую
		t.connection.subscribe([
			{
				subscriber:this,
				feedName:'posts',
				feed: {
					feed:'posts',
					topic: id,
					limit: limit
				}
			},{
				subscriber:this,
				feedName:'topic_data',
				feed: {
					feed:'topic'
					,id: id
					//,fields:['id', 'date_read', 'name', 'post_count'] // пока не работает
				}
			}
		]);

		t.address.set({topic:id, plimit: limit});
	},

	parseFeed: function (feed, actionsUsed) {
		this.stopWaitIndication();

		//console.log('actionsUsed (posts parser):', actionsUsed);

		// разбираем посты
		if (feed.posts) this.parsePosts(feed.posts);

		// разбираем свойства темы
		if (feed.topic_data) this.parseTopicData(feed.topic_data);
	},

	parsePosts: function (postsList) {

		var thisParse = {};

		// определяем, загружается ли тема с нуля
		var firstLoad = this.isClear();

		// считываем инфу о ссылке на конкретное сообщение и достаем тему из подписки
		var referedPost = t.address.get('post');
		var referedTopic = t.address.get('topic')
		var currentTopic = this.subscriptions['posts'].topic;

		// какова была позиция прокрутки перед парсингом?
		var wasAtBottom = this.atBottom;
		var wasAtTop = this.atTop;

		if (!firstLoad && wasAtTop) { // нужно для догрузки

			var topPost = t.units.posts.$content.children().eq(0);
			var topPostOffset = topPost.position().top;
		}

		// собственно, разбор пришедших сообщений
		for (var i in postsList) {
			var postData = postsList[i];
			var existingPost = t.posts[postData.id];

			// обрабатываем информацию о непрочитанности
			var modifier = parseInt(postData.modifier_id, 10);
			var author = parseInt(postData.author_id, 10);

			// если сообщение было изменено и юзер - его редактор - не показывать непрочитанным, кем бы не был создатель
			if (!isNaN(modifier) && modifier > 0) {
				if (modifier == t.user.id) postData.unread = '0';
			} else if (author == t.user.id) {
				// если сообщение не редактировалось - не показываем непрочитанность, если юзер - автор
				postData.unread = '0';
			}

			if (existingPost) { // если в текущем массиве загруженных сообщений такое уже есть

				if (postData.deleted) {
					existingPost.remove();
					delete t.posts[postData.id];
				} else existingPost.fill(postData);

			} else if (!postData.deleted) { // если такого нет и пришедшее не удалено

				var newPost = t.posts[postData.id] = new t.protos.PostNode(postData);
				this.addNode(newPost);

				// этот флаг может означать не только указание на выделение, поэтому выделение тянем из адрессной строки
				if (postData.refered) {
					thisParse.scrollTo = newPost;
				}
			}
		}

		// смотрим, загружено ли уже стартовое сообщение
		var topicHeadLoaded = !!t.posts[currentTopic];

		// если есть (или будет) заглавный пост - скрываем догрузочные кнопки
		if (topicHeadLoaded) {
			this.$showMore.hide();
		} else {
			this.$showMore.show();
		}

		// управление прокруткой
		if (firstLoad) {

			t.ui.editor.show();

			if (thisParse.scrollTo) {
                // прокрутка до поста, указанного в фиде как референсный
				thisParse.scrollTo.show(true);

			} else if (referedPost && t.posts[referedPost] && currentTopic == referedTopic) {
				// прокрутка до поста, вычитанного из адреса
                t.posts[referedPost].select();
				t.posts[referedPost].show(true);

			} else {

                // иначе прокрутить до низа
				this.scrollToBottom();
			}

		} else if (wasAtBottom) { // если апдейт или догрузка и тема была прокручена вниз

			this.scrollToBottom();

		} else if (wasAtTop) { // если догрузка и тема была прокручена до верха

			// todo - неправильно прокручивается, если до догрузки все сообщения помещались и прокрутка не появлялась
			topPost[0].scrollIntoView(true);
			t.units.posts.$scrollArea.scrollTop(t.units.posts.$scrollArea.scrollTop() - topPostOffset);
		}



		// todo разобраться почему работает только через анонимную функцию
		setTimeout(function () {
			this.contentLoaded = 1
		});

		//this.setContentLoaded();
	},



	parseTopicData: function (topicData) {

		this.setTopicName(topicData.topic_name); //вывод названия темы

		// todo - если введем автовысоту через css - убрать
		t.ui.winResize(); // потому что от размера названия темы может разнести хедер

		if (topicData.deleted) t.funcs.unloadTopic();

		// todo - в будущем тут будет проверка на наличие модулей, подписанных на список тем
		if (t.topics && t.topics[topicData.id]) {

			// если тема есть, но она не выделена - значит тема грузилась не кликом по ней
			if (!t.topics[topicData.id].isSelected()) {
				t.topics[topicData.id].select(); // сделать актвной
				// todo - изменить везде show на scrollTo или что-то подобное
				t.topics[topicData.id].show(false); // промотать до нее
			}
		}
	}
});

