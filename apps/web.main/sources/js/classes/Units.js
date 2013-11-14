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
		this.$content.html('');
		this.stopWaitIndication();
	},

	startWaitIndication:function(){
		this.clear();
		this.$scrollArea.addClass('loading');
	},

	stopWaitIndication:function(){
		this.$scrollArea.removeClass('loading');
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

	markActive:function(id){
		if (t.topics[id]) t.topics[id].select()
	},

	setFilterQuery:function(tagSet){
		var newQuery = [];

		console.log('tagSet: ', tagSet)

		for (var i in tagSet){
			newQuery.push(tagSet[i].id);
		}

		t.sync.filterQuery = newQuery.join('|');
		console.log('query: ', t.sync.filterQuery)
		t.rotor.start('load_pages');
	}
});


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

	startWaitIndication:function(){
		this.clear();
		this.$scrollArea.addClass('loading');
	},

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
	}
});

