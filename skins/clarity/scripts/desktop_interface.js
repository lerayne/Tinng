// Главный объект который передается во все прототипы для избежания замыканий
tinng = {
	cfg: cfg, // конфигурация
	txt: txt, // текстовые переменные
	state: {}, // записи о состоянии программы
	funcs: funcs, // базовые простые функции

	// здесь пока будут данные
	data:{
		units:[
			{name:'topics', css:{width:'40%'}},
			{name:'posts', css:{width:'60%'}}
		]
	},

	// переменные, передаваемые на сервер
	sync: {
		action: '',
		maxdateTS: 0,
		curTopic: 0,
		plimit: 1,
		pglimitdateTS: 0,
		topicSort: 'updated',
		tsReverse: true,
		params: {}
	},

	topics: {}
}


// класс занимающийся интерфейсом
UserInterface = function (targetWindow) {

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
};

UserInterface.prototype = {

	tinng:tinng,

	// изменяет высоту окна
	winResize:function () {
		var t = this.tinng;

		var mainH = this.sizes.mainH = this.window.document.documentElement.clientHeight
			- this.$mainHeader[0].offsetHeight
			- this.$mainFooter[0].offsetHeight

		for (var i in t.units) {
			var unit = t.units[i];
			unit.$content.height(mainH - unit.$header[0].offsetHeight - unit.$footer[0].offsetHeight);
		}
	}
};


// Движок кусков HTML, из копий которых собирается страница
ChunksEngine = function () {

	// сюда будут складываться ноды шаблонов
	this.collection = {};

	// выборка нод шаблонов
	$('#tinng-chunks').find('*[data-chunk-name]').each( $.proxy(this, 'populate') );

	// отдельно вбиваем шаблон clearfix
	this.collection['clearfix'] = $('<div class="clearboth"></div>');
}

ChunksEngine.prototype = {

	// заполняет коллекцию
	populate: function (index, value) {
		var $chunk = $(value);
		this.collection[$chunk.attr('data-chunk-name')] = $chunk;
	},

	// желательно использовать этот клонирующий геттер
	get: function (name) {
		return this.collection[name] ? this.collection[name].clone() : $('<div class="'+name+'"></div>');
	}
}


// класс объекта Юнита
Unit = function (map) {
	var t = this.tinng;

	var $body = this.$body = t.chunks.get('unit');
	this.$content = $body.find('.scroll-area');
	this.$header = $body.find('header');
	this.$footer = $body.find('footer');

	$body.addClass(map.name);
	$body.css(map.css);

	t.ui.$unitsArea.append($body);
}

Unit.prototype = {
	tinng:tinng
}



InterfaceStarter = function () {
	var t = this.tinng;

	t.ui = new this.UserInterface(window);
	t.chunks = new this.ChunksEngine();
	t.units = {};

	this.placeUnits(t.data['units']);

	t.ui.$window.resize(t.ui.winResize).resize();

	//t.units.topics.$content.append($('<div style="height:1000px;">'));
	//t.units.posts.$content.append($('<div style="height:1000px;">'));
};

InterfaceStarter.prototype = {
	tinng:tinng,
	Unit:Unit,
	UserInterface:UserInterface,
	ChunksEngine:ChunksEngine,


	placeUnits:function (array) {
		var t = this.tinng;

		for (var key in array) {
			var val = array[key];
			t.units[val.name] = new this.Unit(val);
		}

		t.ui.$unitsArea.append(t.chunks.get('clearfix'));
	}
};