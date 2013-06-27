/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:54 PM
 * To change this template use File | Settings | File Templates.
 */

// класс объекта Юнита

tinng.protos.Unit = Class({
	tinng:tinng,

	initialize:function (data) {
		this.construct(data);
	},

	construct:function (data) {
		var t = this.tinng;

		/* СБОР */

		this.data = data;

		this.contentLoaded = 0;

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

		if (data.header) {
			var headerPanel = new t.protos.ui.Panel(data.header);
			this.$header.append(headerPanel.$body);
			this.header = headerPanel;
		}

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
	}
});


tinng.protos.TopicsUnit = Class(tinng.protos.Unit, {

	construct:function () {
		this.tinng.protos
			.Unit.prototype
			.construct.apply(this, arguments);

		this.newTopic = $.proxy(this, 'newTopic');

		this.header.newTopic.on('click', this.newTopic);
	},

	newTopic:function () {
		this.header.newTopic.block();
		this.tinng.units.posts.newTopic();
	}
});


tinng.protos.PostsUnit = Class(tinng.protos.Unit, {

	construct:function () {
		var t = this.tinng;

		t.protos.Unit.prototype
			.construct.apply(this, arguments);

		this.topicRename = $.proxy(this, 'topicRename');
		this.enterRenameMode = $.proxy(this, 'enterRenameMode');
		this.cancelRename = $.proxy(this, 'cancelRename');
		this.saveName = $.proxy(this, 'saveName');
		this.cancelNewTopic = $.proxy(this, 'cancelNewTopic');

		this.header.save.hide();
		this.header.cancel.hide();
		this.header.cancelNewTopic.hide();

		this.header.topicRename.on('click', this.topicRename);
		this.header.cancel.on('click', this.cancelRename);
		this.header.save.on('click', this.saveName);
		this.header.cancelNewTopic.on('click', this.cancelNewTopic)

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

		this.tinng.protos
			.Unit.prototype
			.addNode.call(this, node);
	},

	onScroll:function () {
		var t = this.tinng;

		this.tinng.protos
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
		var t = this.tinng;
		t.funcs.loadMore(t.sync.plimit + 1);
	},

	showAll:function () {
		var t = this.tinng;
		t.funcs.loadMore(0);
	},

	topicRename:function () {
		JsHttpRequest.query('backend/service.php', { // аргументы:
			action:'check_n_lock',
			id:this.tinng.sync.curTopic
		}, this.enterRenameMode, true);

		return false;
	},

	enterRenameMode:function (result, errors) {
		var t = this.tinng;

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
		var t = this.tinng;

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
			id:this.tinng.sync.curTopic
		}, function () {
		}, true);

//		this.mainPanel.unlock.$body.hide();

		return false; // preventDefault + stopPropagation
	},

	newTopic:function () {
		var t = this.tinng;

		t.funcs.unloadTopic();

		this.header.topicRename.hide();
		this.header.cancelNewTopic.show();
		this.$showMore.hide();
		this.header.topicName.$body.html('');
		this.header.topicName.$body.attr('contenteditable', true);

		return false;
	},

	exitNewTopicMode:function(){
		this.header.topicRename.show();
		this.header.cancelNewTopic.hide();
		this.header.topicName.$body.removeAttr('contenteditable');
		this.tinng.units.topics.header.newTopic.unblock();
	},

	cancelNewTopic:function(){
		var t = this.tinng;

		t.funcs.unloadTopic();
		this.header.topicName.$body.html('');
		this.exitNewTopicMode();

		return false;
	}
});

