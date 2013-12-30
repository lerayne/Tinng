/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:52 PM
 * To change this template use File | Settings | File Templates.
 */

// Поле
tinng.protos.ui.Field = function (data) {
    this.$body = $('<div/>');

    if (data.label) this.label = data.label;

    if (data.id) this.$body.attr('id', data.id);
    if (data.cell) this.$body.attr('data-cell', data.cell);
    if (data.cssClass) this.$body.addClass(data.cssClass);
    if (data.css) this.$body.css(data.css);
}

// Кнопка
tinng.protos.ui.Button = function (data) {

    this.$body = $('<div class="button-body">');
    this.$button = $('<div class="button">');
    this.$body.append(this.$button);

    if (data.label) this.label = data.label;

    if (data.id) this.$button.attr('id', data.id);
    if (data.cell) this.$button.attr('data-cell', data.cell);
    if (data.cssClass) this.$button.addClass(data.cssClass);
    if (data.css) this.$button.css(data.css);

    if (data.text) this.$button.html('<span>' + data.text + '</span>');

    if (data.icon) {
        this.$button.css('background-image', 'url("'+ t.cfg.appdir+'skins/clarity/images/icons/' + data.icon + '")');
        this.$button.addClass('with-icon');
    }

    if (data.tip) {
        this.$tip = $('<div class="tip"><div class="body">' + data.tip + '</div><div class="tail"></div></div>')
            .hide().appendTo(this.$button);

        this.waitTip = $.proxy(this, 'waitTip');
        this.showTip = $.proxy(this, 'showTip');
        this.hideTip = $.proxy(this, 'hideTip');

        this.$button.on('mouseenter', this.waitTip);
        this.$button.on('mouseleave', this.hideTip);
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

// тег (визуальное представление)
tinng.protos.ui.Tag = function (data, closeCallback) {
	this.data = data;
	this.$body = t.chunks.get('tag');
	//console.log(this.$body)

	var textContainer = this.$body.find('[data-cell="text"]');
	var closeButton = this.$body.find('[data-cell="close"]');

	textContainer.text(data.name);

	if (typeof closeCallback != 'undefined') {
		closeButton.show();
		closeButton.click(closeCallback)
	}
}

tinng.protos.ui.Tag.prototype = {

}


// todo - что-то тут не так. в большинстве случаев используется разделенная модель данных и представления, но в управлени
// клавишами - используются свойства ДОМа и траверсинг для управления данными. Во-первых медленнее, во вторых думаю нужна
// какая-то новая парадигма

// умный поиск по тегам
tinng.protos.ui.SearchBox = function(config){
	t.funcs.bind(this);
	var that = this;

	// настройки по умолчанию и их перегрузка
	this.conf = t.funcs.objectConfig(config, this.defaultConf = {
		css:'',
		cssClass:'',
		placeholder:'Search...',
		suggest:'on_topics',
		clearOnConfirm:true,

		// вызывается когда объект поиска подтверждается тем или иным способом
		onConfirm:function(){}
	});

	// внутренние данные
	// клавиши, по нажатию которых запрос на подсказку НЕ отправляется (управляющие клавиши, кроме backspace и delete)
	// todo - возможно прикрутить сюда keylistener
	this.nonTextButtons = [9,10,13,16,17,18,19,20,27,33,34,35,36,37,38,39,40,45,91,92,93,112,113,114,115,116,117,118,
		119,120,121,122,123,144,145];

	this.tagSet = {};
	this.tagList = [];
	this.currentSuggest = {};

	// сборка объекта
	this.$body = $('<div class="smart-search"/>');
	if (this.conf.cssClass) this.$body.addClass(this.conf.cssClass);
	if (this.conf.css) this.$body.css(this.conf.css);

	this.$smartArea = $('<div class="smart-area" />').appendTo(this.$body);
	this.$input = $('<input type="text" placeholder="'+ this.conf.placeholder +'">').appendTo(this.$body);
	this.$throbber = $('<div class="throbber updating" />').appendTo(this.$body);
	this.$suggestBox = $('<div class="suggest-box" />').appendTo(this.$body);


	/* привязка событий *//////////////////
	this.$input.on('keyup', this.onType);

	// по этому событию по факту отправляется предыдущее значение, благодаря чему тег не удаляется с удалением последней буквы
	this.$input.on('keydown', this.tryBS);

	this.$input.on('paste', this.suggest);

	// если саджест был не очищен, а просто скрыт
	this.$input.on('focus', function(){
		if (that.$suggestBox.children().size()) that.$suggestBox.show();
	})

	this.$body.on('click', t.funcs.stopPropagation);

	$('body').on('click', this.hideSuggested);
}

tinng.protos.ui.SearchBox.prototype = {
	onType:function(e){

		// если нажата кнопка, вводящая что-либо, а не управляющая (допускаются также backspace и delete) -
		if (this.nonTextButtons.indexOf(e.keyCode) == -1) {

			// сбросить текущий таймер
			if (this.timeout) clearTimeout(this.timeout);

			// если запрос уже ушел, но еще не вернулся - абортнуть его
			// todo - тут не совсем понятно, точно ли нужен status, потому что у только что отправленного запроса статус - null
			if (this.request && this.request.status) {
				this.request.onreadystatechange = this.onAbort;
				this.request.abort();
			}

			// (ре)стартуем таймер
			this.timeout = setTimeout(this.suggest, t.cfg.xhr_suggest);
		}

		// если бокс виден, и нажата одна из вертикальных стрелок - обработать как перемещение по меню
		if (this.$suggestBox.is(':visible') && (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13)) {
			var suggests = this.$suggestBox.children();
			var active = suggests.filter('.active');

			if (e.keyCode == 40) {
				active = active.next()
				if (!active.size()) active = suggests.first();
			}

			if (e.keyCode == 38) {
				active = active.prev()
				if (!active.size()) active = suggests.last();
			}

			if (e.keyCode == 13 && active.size()) {
				this.addTagToFilter(this.currentSuggest[active.attr('data-tag-id')].data)
			}

			suggests.removeClass('active');
			active.addClass('active');
		}
	},

	tryBS:function(e){
//		console.log('code:',e.keyCode)
		// если нажат бекспейс, строка пуста, а теги в смарт-зоне есть - удалить последний
		if (e.keyCode == 8 && this.$input.val() == '' && this.tagList.length > 0) {
			var lastTag = this.tagList[this.tagList.length-1];
			this.removeTagFromFilter(lastTag.data);
		}
	},

	suggest:function(){
		var that = this;

		var query = this.$input.val();

		if (query.length > 1) {
//			console.log('here goes the query: ', query);

			// todo - возможно, создать обертку вокруг реквеста, которая будет управлять отображением троббера и лагом сама
			// если запрос не возвращается дольше заданного времени (xhr_lag) - показываем троббер
			this.XHRLag = setTimeout(function(){
				that.$throbber.css({visibility:'visible'})
			}, t.cfg.xhr_lag);

			this.request = new JsHttpRequest();
			this.request.onreadystatechange = this.onResponse;
			this.request.open(null, './backend/suggest.php', true);
			this.request.send({
				suggest: this.conf.suggest,
				subject: query
			});
		} else {
			this.hideSuggested();
		}
	},

	onResponse:function(){

		switch (this.request.readyState){

			// success
			case 4:
//				console.log('query returned:', this.request.responseJS);
				this.parseSuggested(this.request.responseJS)
				break;
		}

		this.clearLag();
	},

	parseSuggested:function(data){
		var that = this;

		// очищаем выдачу
		this.$suggestBox.children().remove();
		this.currentSuggest = {};

		// если есть результаты - строим новую
		if (data.length > 0) {

			for (var i in data) {
				var suggestItem = $('<div class="item" data-tag-id="'+ data[i].id +'">').appendTo(this.$suggestBox);
				var tag = this.currentSuggest[data[i].id] = new t.protos.ui.Tag(data[i]);
				suggestItem.append(tag.$body);

				tag.$body.on('click', function(){
					that.addTagToFilter(tag.data)
				})
			}

			this.$suggestBox.show();

		// иначе убираем бокс
		} else {
			this.hideSuggested();
		}
	},

	onAbort:function(){
		this.clearLag();
	},

	clearLag:function(){
		if (this.XHRLag) clearTimeout(this.XHRLag);
		this.$throbber.css({visibility:'hidden'});
	},

	hideSuggested:function(){
		this.$suggestBox.hide();
		this.$suggestBox.children().removeClass('active');
	},

	addTagToFilter:function(data){
		var that = this;

		if (typeof this.tagSet[data.id] == 'undefined') {
			//console.log('add tag')
			this.tagSet[data.id] = data;

			var smartAreaTag = new t.protos.ui.Tag(data, function(){
				that.removeTagFromFilter(data);
			});
			this.$smartArea.append(smartAreaTag.$body);
			this.tagList.push(smartAreaTag);

			// сбрасываем интерфейс в начальное положение

			if (this.conf.clearOnConfirm) {
				this.$input.val('');
				this.$suggestBox.children().remove();
				this.hideSuggested();
			} else {
				this.$suggestBox.find('[data-tag-id="'+ data.id +'"]').remove();
				if (!this.$suggestBox.children().size()) this.hideSuggested();
			}

			//передаем выбранные теги в коллбек
			this.conf.onConfirm(this.tagSet)
		}
	},

	removeTagFromFilter:function(data) {

		// удаляем из списка, а заодно и из DOM
		var newTagList = []
		for (var i = 0; i < this.tagList.length; i++) {
			var tag = this.tagList[i];
			if (tag.data.id == data.id) tag.$body.remove(); else newTagList.push(tag);
		}
		this.tagList = newTagList;

		//удаляем из объекта
		delete(this.tagSet[data.id]);

		//передаем выбранные теги в коллбек
		this.conf.onConfirm(this.tagSet)
	}
}



tinng.protos.ui.Panel = function (dataArray) {

    this.$body = $('<div class="panel revealer3">');

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

}
