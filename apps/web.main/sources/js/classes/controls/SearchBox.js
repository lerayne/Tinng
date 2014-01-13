/**
 * Created by M. Yegorov on 1/13/14.
 */

// todo - что-то тут не так. в большинстве случаев используется разделенная модель данных и представления, но в управлени
// клавишами - используются свойства ДОМа и траверсинг для управления данными. Во-первых медленнее, во вторых думаю нужна
// какая-то новая парадигма

// умный поиск по тегам
tinng.protos.ui.SearchBox = function(config){
	t.funcs.bind(this);
	var that = this;

	// настройки по умолчанию и их перегрузка
	this.conf = t.funcs.objectConfig(config, this.defaultConf = {
		tags:[],
		tagType:'user',
		css:'',
		cssClass:'',
		placeholder:'Search...',
		suggest:'tags',
		clearOnConfirm:true,
		tagsOnly:false,

		// вызывается когда объект поиска подтверждается тем или иным способом
		onConfirm:function(){}
	});

	this.prefix = {
		'user':'#',
		'personal':'@',
		'admin':'$'
	}

	// внутренние данные
	// клавиши, по нажатию которых запрос на подсказку НЕ отправляется (управляющие клавиши, кроме backspace и delete)
	// todo - возможно прикрутить сюда keylistener
	this.nonTextButtons = [9,10,13,16,17,18,19,20,27,33,34,35,36,37,38,39,40,45,91,92,93,112,113,114,115,116,117,118,
		119,120,121,122,123,144,145];

	// символы, которые не могут быть частью тега в режиме ввода только тегов
	this.nonTagSymbols = [',', ';', ' ', '?', '=', '"', "'"];

	this.tagSelection = [];
	this.tagList = {};

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

	if (this.conf.tags.length) {
		for (var i = 0; i < this.conf.tags.length; i++) {
			var tag = this.conf.tags[i];
			this.addTagToSelection(tag, 'uiOnly');
		}
	}
}

tinng.protos.ui.SearchBox.prototype = {
	onType:function(e){

		var curVal = this.$input.val();
		var lastChar = curVal ? curVal[curVal.length-1] : null;

		if (this.conf.tagsOnly) {
			if (this.nonTagSymbols.indexOf(lastChar) != -1) {
				this.$input.val(curVal.slice(0, curVal.length-1))
			}
		}

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

		// если нажата одна из вертикальных стрелок, или enter
		if ([38,40].indexOf(e.keyCode) != -1) {

			//Если виден результат саджеста
			if (this.$suggestBox.is(':visible')) {
				var suggests = this.$suggestBox.children();
				var active = suggests.filter('.active');

				switch (e.keyCode) {
					case 40:
						active = active.next()
						if (!active.size()) active = suggests.first();
						break;

					case 38:
						active = active.prev()
						if (!active.size()) active = suggests.last();
						break;
				}

				suggests.removeClass('active');
				active.addClass('active');
			}
		}

		// что делаем по enter-у
		if (e.keyCode == 13) this.onEnter();
	},

	onEnter:function(){
		var active = this.$suggestBox.find('.active');

		if (this.$suggestBox.is(':visible') && active.size()) {

			this.addTagToSelection(active.attr('data-tag'));

		} else if (this.conf.tagsOnly) {

			this.tagManualInput(this.$input.val());

			//this.addTagToSelection(this.$input.val())

		} else {

		}
	},

	tryBS:function(e){
		// если нажат бекспейс, строка пуста, а теги в смарт-зоне есть - удалить последний
		if (e.keyCode == 8 && this.$input.val() == '' && this.tagSelection.length > 0) {
			var lastTag = this.$smartArea.children().last().attr('data-tag');
			this.removeTagFromSelection(lastTag);
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
		
		//превращаем список объектов в список текстовых тегов
		var tags = [];
		for (var i in data) {
			tags.push(data[i].name);
		}
		data = tags;

		// если есть результаты - строим новую
		if (data.length > 0) {

			data.forEach(this.createSuggestedItem);
			this.$suggestBox.show();

			// иначе убираем бокс
		} else {
			this.hideSuggested();
		}
	},

	createSuggestedItem:function(tagName, i){
		var that = this;

		if (this.tagSelection.indexOf(tagName) == -1) {

			var suggestItem = $('<div class="item" data-tag="'+ tagName +'">').appendTo(that.$suggestBox);

			var tag = new t.protos.ui.Tag({
				name:tagName,
				type:this.conf.tagType
			}, {
				bodyClick:function(){
					that.addTagToSelection(tagName);
				}
			});

			suggestItem.append(tag.$body);
			suggestItem.append(tag.$body);
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

	addTagToSelection:function(tagName, uiOnly) {
		var that = this;

		if (this.tagSelection.indexOf(tagName) == -1) {

			var prefix = this.prefix[this.conf.tagType];

			if (tagName.charAt(0) != prefix) tagName = prefix + tagName;



			this.tagSelection.push(tagName);

			var smartAreaTag = this.tagList[tagName] = new t.protos.ui.Tag({
				name:tagName,
				type:this.conf.tagType
			}, {
				closeClick:function(){
					that.removeTagFromSelection(tagName);
				}
			});
			this.$smartArea.append(smartAreaTag.$body);

			// сбрасываем интерфейс в начальное положение

			if (this.conf.clearOnConfirm) {
				this.$input.val('');
				this.$suggestBox.children().remove();
				this.hideSuggested();
			} else {
				this.$suggestBox.find('[data-tag="'+ tagName +'"]').remove();
				if (!this.$suggestBox.children().size()) this.hideSuggested();
			}

			//передаем выбранные теги в коллбек
			if (typeof uiOnly == 'undefined') this.conf.onConfirm(this.tagSelection)
		}
	},

	removeTagFromSelection:function(tagName, uiOnly) {

		// удаляем из списка и из DOM
		if (this.tagList[tagName]) {
			this.tagList[tagName].$body.remove();
			delete this.tagList[tagName];
		}

		this.tagSelection.splice(this.tagSelection.indexOf(tagName),1);

		//передаем выбранные теги в коллбек
		if (typeof uiOnly == 'undefined') this.conf.onConfirm(this.tagSelection)
	},

	tagManualInput:function(tagName){

		if (tagName.replace(this.prefix[this.conf.tagType], '').length >= 3) {
			this.addTagToSelection(tagName.toLowerCase());
		} else {
			alert('tag too short!');
		}
		//todo - здесь будут умные подсказки по созданию новых тегов
	}
}
