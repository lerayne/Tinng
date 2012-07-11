/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 4:27 PM
 * To change this template use File | Settings | File Templates.
 */

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
