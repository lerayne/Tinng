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



// класс объекта Юнита
tinng.protos.Unit = function (map) {

	/// СБОР ///

	var t = this.tinng;

	var $body = this.$body = t.chunks.get('unit');
	this.$scrollArea = $body.find('.scroll-area');
	this.$content = $body.find('.content');
	this.$header = $body.find('header');
	this.$footer = $body.find('footer');

	/// ОБРАБОТКА ///

	$body.addClass(map.name);
	$body.css(map.css);
}

tinng.protos.Unit.prototype = {
	tinng:tinng
}



// Редактор сообщений
tinng.protos.Editor = function () {
	var $body = this.$body = this.tinng.chunks.get('editor');
}

tinng.protos.Editor.prototype = {
	tinng:tinng
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

		for (var i in t.units) {
			var unit = t.units[i];
			unit.$scrollArea.height(mainH - unit.$header.offsetHeight() - unit.$footer.offsetHeight());
		}

		this.editorResize();
	},

	// Подгоняет внешний вид редактора под окно
	editorResize:function () {
		var posts = this.tinng.units.posts;
		this.editor.$body.width(posts.$content.width());
		posts.$content.css('margin-bottom', this.editor.$body.offsetHeight());
	}
};