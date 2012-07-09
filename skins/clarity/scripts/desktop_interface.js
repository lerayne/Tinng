// Движок кусков HTML, из копий которых собирается страница
tinng.protos.ChunksEngine = function (containerId, attr) {
	this.collection = {};
	this.attr = attr;
	$('#' + containerId + ' [' + attr + ']').each($.proxy(this, 'populate'));
}

tinng.protos.ChunksEngine.prototype = {

	// заполняет коллекцию
	populate:function (index, value) {
		var $chunk = $(value);
		this.collection[$chunk.attr(this.attr)] = $chunk;
	},

	// желательно использовать этот клонирующий геттер
	get:function (name) {
		return this.collection[name] ? this.collection[name].clone() : $('<div class="' + name + '"></div>');
	}
}


tinng.protos.ui.Field = function (data) {
	this.$body = $('<div/>');

	if (data.label) this.label = data.label;

	if (data.id) this.$body.attr('id', data.id);
	if (data.cell) this.$body.attr('data-cell', data.cell);
	if (data.cssClass) this.$body.addClass(data.cssClass);
	if (data.css) this.$body.css(data.css);
}

tinng.protos.ui.Button = function (data) {
	this.$body = $('<div/>');
	this.$button = $('<div/>');
	this.$body.append(this.$button);

	if (data.label) this.label = data.label;

	this.$button.addClass('button');

	if (data.id) this.$button.attr('id', data.id);
	if (data.cell) this.$button.attr('data-cell', data.cell);
	if (data.cssClass) this.$button.addClass(data.cssClass);
	if (data.css) this.$button.css(data.css);

	if (data.text) this.$button.html('<span>' + data.text + '</span>');

	if (data.icon) {
		this.$button.css('background-image', 'url("skins/clarity/images/icons/' + data.icon + '")');
		this.$button.addClass('with-icon');
	}

	if (data.tip) {
		this.$tip = $('<div class="tip"><div class="body">' + data.tip + '</div><div class="tail"></div></div>')
			.hide().appendTo(this.$button);

		this.waitTip = $.proxy(this, 'waitTip');
		this.showTip = $.proxy(this, 'showTip');
		this.hideTip = $.proxy(this, 'hideTip');

		this.$button.on('mouseover', this.waitTip);
		this.$button.on('mouseout', this.hideTip);
		this.$button.on('click', this.hideTip);
	}
}

tinng.protos.ui.Button.prototype = {
	on:function (action, callback) {
		this.$button.on(action, callback);
	},

	show:function () {
		this.$body.show();
	},

	hide:function () {
		this.$body.hide();
	},

	waitTip:function () {
		this.timeout = setTimeout(this.showTip, 800);

		return false;
	},

	showTip:function () {
		var targetOpacity = this.$tip.css('opacity');
		//var leftOffset = (this.$body.offsetWidth() / 2) - (this.$tip.width() / 2);
		this.$tip.css({
			opacity:0,
			bottom:10//,
			//	left:leftOffset
		}).show();
		this.$tip.animate({opacity:targetOpacity, bottom:20}, 150);
	},

	hideTip:function (e) {
		if (this.timeout) clearTimeout(this.timeout);
		this.$tip.hide();

		return false;
	},

	block:function () {
		if (this.$clone) this.$clone.show();
		else this.$clone = this.$button.clone().addClass('blocked').appendTo(this.$body);
		this.$button.hide();
	},

	unblock:function () {
		if (this.$clone) {
			this.$clone.hide();
			this.$button.show();
		}
	}
}

tinng.protos.ui.Panel = function (dataArray) {
	var t = this.tinng;

	this.$body = $('<div/>');
	this.$body.addClass('panel revealer3');

	for (var i = 0; i < dataArray.length; i++) {
		var data = dataArray[i];

		if (typeof t.protos.ui[data.type] == 'function') {
			var control = new t.protos.ui[data.type](data);
			this.$body.append(control.$body);
			if (control.label) this[control.label] = control;
		}
	}

	this.$body.append(t.chunks.get('clearfix'));
}

tinng.protos.ui.Panel.prototype = {
	tinng:tinng
}


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

	setHeight:function (int) {
		var height = int - this.$header.offsetHeight() - this.$footer.offsetHeight();
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

		this.header.save.hide();
		this.header.cancel.hide();

		this.header.topicRename.on('click', this.topicRename);
		this.header.cancel.on('click', this.cancelRename);
		this.header.save.on('click', this.saveName);

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

		console.log('new topic')
		t.funcs.unloadTopic();

		this.header.topicRename.hide();
		this.header.topicName.$body.html('');
		this.header.topicName.$body.attr('contenteditable', true);
	}
});


// Редактор сообщений
tinng.protos.Editor = function () {
	var $body = this.$body = this.tinng.chunks.get('editor');

	this.$submit = $body.find('.submit.button');
	this.$messageBody = $body.find('.textarea');
	this.$messageTitle = $body.find('.title');

	this.submitNew = $.proxy(this, 'submitNew');

	this.$submit.click(this.submitNew);
}

tinng.protos.Editor.prototype = {
	tinng:tinng,

	submitNew:function () {
		var t = this.tinng;

		if (this.$messageBody.html() != '') { // todo - нужна нормальная проверка на пустое собщение
			t.rotor.start('add_post', {
				message:this.$messageBody.html(),
				title:this.$messageTitle.val()
			});

			this.$messageBody.html(''); // todo - сделать затенение кнопки, если сообщение пустое
			this.$messageTitle.val('');
		}
	}
}


// класс занимающийся интерфейсом
tinng.protos.UserInterface = function (targetWindow) {

	/// СБОР ///

	var t = this.tinng;

	// ссылки на важные эелементы
	this.window = targetWindow;
	this.$window = $(targetWindow);

	this.$mainFrame = $('#tinng-main');
	this.$unitsArea = $('#tinng-units-area');
	this.$mainHeader = $('#tinng-main-header');
	this.$mainFooter = $('#tinng-main-footer');

	// коллекция размеров
	this.sizes = {};

	// проксирование методов
	this.winResize = $.proxy(this, 'winResize');
	this.editorResize = $.proxy(this, 'editorResize');

	/// ОБРАБОТКА ///

	// размещение юнитов

	t.units.topics = new t.protos.TopicsUnit(t.data.units[0]);
	t.units.posts = new t.protos.PostsUnit(t.data.units[1]);
	this.$unitsArea.append(
		t.units.topics.$body,
		t.units.posts.$body,
		t.chunks.get('clearfix')
	);

	// размещение редактора
	var editor = this.editor = new t.protos.Editor();
	editor.$body.on('keyup', this.editorResize);
	t.units.posts.$scrollArea.append(editor.$body);

	// вешаем событие на ресайз окна
	this.$window.resize(this.winResize).resize();
	t.units.posts.header.topicName.$body.on('keyup', this.winResize);
};

tinng.protos.UserInterface.prototype = {
	tinng:tinng,

	// изменяет высоту окна
	winResize:function () {
		var t = this.tinng;

		var mainH = this.sizes.mainH = this.window.document.documentElement.clientHeight
			- this.$mainHeader.offsetHeight()
			- this.$mainFooter.offsetHeight()
			;

		console.log(this.$mainHeader.offsetHeight());

		for (var key in t.units) t.units[key].setHeight(mainH);

		this.editorResize();
	},

	// Подгоняет внешний вид редактора под окно
	editorResize:function () {
		var posts = this.tinng.units.posts;
		this.editor.$body.width(posts.$content.width());

		var atBottom = posts.atBottom;
		posts.$contentWrap.css('padding-bottom', this.editor.$body.offsetHeight());
		if (atBottom) posts.scrollToBottom();
		/*
		 возможно в будущем для еще большей плавности стоит изменять целую пачку стилей с тем чтобы у поля ввода позиция
		 не всегда была fixed. Для этого придется повесить событие OnScroll и отследивать степень прокрутки. Возможно - тогда
		 не придется и плясать с нижним паддингом и враппер получится убрать
		 */
	}
};