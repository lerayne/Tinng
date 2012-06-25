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



tinng.protos.ui.Field = function(data){
	this.$body = $('<div/>');

	if (data.label) this.label = data.label;

	if (data.id) this.$body.attr('id', data.id);
	if (data.cell) this.$body.attr('data-cell', data.cell);
	if (data.cssClass) this.$body.addClass(data.cssClass);
	if (data.css) this.$body.css(data.css);
}

tinng.protos.ui.Button = function(data){
	this.$body = $('<div/>');

	if (data.label) this.label = data.label;

	this.$body.addClass('button');

	if (data.id) this.$body.attr('id', data.id);
	if (data.cell) this.$body.attr('data-cell', data.cell);
	if (data.cssClass) this.$body.addClass(data.cssClass);
	if (data.css) this.$body.css(data.css);

	if (data.text) this.$body.html(data.text);
}

tinng.protos.ui.Button.prototype = {
	on:function(action, callback){
		this.$body.on(action, callback);
	}
}

tinng.protos.ui.Panel = function(dataArray) {
	var t = this.tinng;

	this.$body = $('<div/>');
	this.$body.addClass('panel');

	for (var i = 0; i < dataArray.length; i++) {
		var data = dataArray[i];

		if (typeof t.protos.ui[data.type] == 'function'){
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
tinng.protos.Unit = function (data) {
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

	if (data.name == 'posts'){
		this.onPostsScroll = $.proxy(this, 'onPostsScroll');
		this.showNext = $.proxy(this, 'showNext');
		this.showAll = $.proxy(this, 'showAll');
	}

	/* ОБРАБОТКА */

	$body.addClass(data.name);
	$body.css(data.css);

	if (data.header){
		var headerPanel = new t.protos.ui.Panel(data.header);
		this.$header.append(headerPanel.$body);
		this.header = headerPanel;
	}

	this.$scrollArea.on('scroll', this.onScroll);

	if (data.name == 'posts'){
		this.$scrollArea.on('scroll', this.onPostsScroll);

		this.$showMore = $('<div class="showmore"/>');
		this.$contentWrap.prepend(this.$showMore);

		var showNext = $('<a>'+t.txt.show_more+'</a>');
		var showAll = $('<a>'+t.txt.show_all+'</a>');

		showNext.click(this.showNext);
		showAll.click(this.showAll);

		this.$showMore.append(showNext, showAll);
	}

	this.$scrollArea.scroll();
}

tinng.protos.Unit.prototype = {
	tinng:tinng,

	setHeight:function (int) {
		var height = int - this.$header.offsetHeight() - this.$footer.offsetHeight();
		this.scrollAreaH = height;
		this.$scrollArea.height(height);
	},

	addNode:function (node) {
		var t = this.tinng;

		if (this.data.name == 'posts'){

			var posts = this.$content.children();

			if (posts.size()) for (var i=0; i < posts.length; i++) {
				var $post = $(posts[i]);
				if (node.id < parseInt($post.attr('data-number'))) {
					node.$body.insertBefore($post);
					return;
				}
			}
		}

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

	onPostsScroll:function () {
		var t = this.tinng;

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

	showNext:function(){
		var t = this.tinng;
		t.funcs.loadMore(t.sync.plimit+1);
	},

	showAll:function(){
		var t = this.tinng;
		t.funcs.loadMore(0);
	}
}


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

	submitNew:function(){
		var t = this.tinng;

		t.rotor.start('add_post', {
			message:this.$messageBody.html(),
			title:this.$messageTitle.val()
		});
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
	for (var key in t.data.units) {
		var val = t.data.units[key];
		var $unit = t.units[val.name] = new t.protos.Unit(val);
		this.$unitsArea.append($unit.$body);
	}
	this.$unitsArea.append(t.chunks.get('clearfix'));
	//t.units.posts.$content.append($('<div style="height:1000px">'));

	// размещение редактора
	var editor = this.editor = new t.protos.Editor();
	editor.$body.on('keyup', this.editorResize);
	t.units.posts.$scrollArea.append(editor.$body);

	// вешаем событие на ресайз окна
	this.$window.resize(this.winResize).resize();
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