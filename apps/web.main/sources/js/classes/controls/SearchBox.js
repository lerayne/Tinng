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
		searchMode:'AND',
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
	//this.nonTagSymbols = [',', ';', ' ', '?', '=', '+', '"', "'"];
	this.nonTagSymbols =   [44,  59,  32,  63,  61,  43,  34,  39];

	this.tagSelection = [];
	this.tagList = {};

	// сборка объекта
	this.$body = $('<div class="smart-search"/>');
	if (this.conf.cssClass) this.$body.addClass(this.conf.cssClass);
	if (this.conf.css) this.$body.css(this.conf.css);

	this.addBtn = new t.protos.ui.Button({
		text:t.txt.add_tag,
		cssClass:'add submit'
	});
	this.addBtn.$body.css('display', 'none');

	this.$smartArea = $('<div class="smart-area" />').appendTo(this.$body);
	this.$input = $('<input type="text" placeholder="'+ this.conf.placeholder +'">').appendTo(this.$body);
	this.addBtn.$body.appendTo(this.$body);
	this.$throbber = $('<div class="throbber updating" />').appendTo(this.$body);
	this.$suggestBox = $('<div class="suggest-box" />').appendTo(this.$body);

	// если это форма редактирования тегов - добавляем по правилу "ИЛИ"
	if (this.conf.tagsOnly) {
		this.conf.searchMode = 'OR';
		this.addBtn.on('click', this.onEnter);
		this.addBtn.$body.css('display', 'inline-block');
	}


	/* привязка событий *//////////////////
	this.$input.on('keyup', this.onType);
	this.$input.on('keypress', this.onChar);
	//this.$input.on('blur', this.onEnter)

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
			this.addTagToSelection(typeof tag == 'object' ? tag.name : tag, 'uiOnly');
		}
	}
}

tinng.protos.ui.SearchBox.prototype = {
	onType:function(e){

		//console.log(e.originalEvent.keyIdentifier, e.keyCode, e.charCode, e)

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

		// если нажата одна из вертикальных стрелок
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

	onChar:function(e){
		if (this.nonTagSymbols.indexOf(e.charCode) != -1) return false;
	},

	onEnter:function(){
		var active = this.$suggestBox.find('.active');

		if (this.$suggestBox.is(':visible') && active.size()) {

			this.addTagToSelection(active.attr('data-tag'));

		} else if (this.conf.tagsOnly) {

			if (this.$input.val().length) this.tagManualInput(this.$input.val());
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

		this.timeout = false;
		if (this.request) this.clear();

		var query = this.$input.val();

		if (query.length > 1) {

			this.addBtn.block();

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
			this.clear();
			this.$suggestBox.children().remove();
			this.hideSuggested();
		}
	},

	onResponse:function(){

		switch (this.request.readyState){

			// success
			case 4:
				this.parseSuggested(this.request.responseJS)
				this.clear();

				break;
		}
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

			if (this.$suggestBox.children().size()) this.$suggestBox.show();

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
		}
	},

	onAbort:function(){
		this.clear();
	},

	clear:function(){

		if (this.request && this.request.status != 200) {
			this.request.onreadystatechange = false;
			this.request.abort();
		}

		this.request = false;

		if (this.XHRLag) clearTimeout(this.XHRLag);
		this.XHRLag = false;

		if (this.timeout) clearTimeout(this.timeout);
		this.timeout = false;

		this.addBtn.unblock();
		this.$throbber.css({visibility:'hidden'});
	},

	hideSuggested:function(){
		this.$suggestBox.hide();
		this.$suggestBox.children().removeClass('active');
	},

	addTagToSelection:function(tagName, uiOnly) {
		var that = this;

		var prefix = this.prefix[this.conf.tagType];

		if (this.tagSelection.indexOf(tagName) == -1 && this.tagSelection.indexOf(prefix+tagName) == -1) {

			if (tagName.charAt(0) != prefix) tagName = prefix + tagName;

			this.tagSelection.push(tagName);

			var operation = false;

			if (this.tagSelection.length > 1) {
				if (this.conf.searchMode == 'AND') {
					operation = '+';
				}
			}

			var smartAreaTag = this.tagList[tagName] = new t.protos.ui.Tag({
				name:tagName,
				type:this.conf.tagType,
				operation: operation
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
		} else {
			alert(t.txt.error_tag_exists)
		}
	},

	removeTagFromSelection:function(tagName, uiOnly) {

		// удаляем из выделения
		this.tagSelection.splice(this.tagSelection.indexOf(tagName),1);

		// удаляем из списка и из DOM
		if (this.tagList[tagName]) {
			this.tagList[tagName].$body.remove();
			if (this.tagSelection.length > 0) this.tagList[this.tagSelection[0]].removeOperation()
			delete this.tagList[tagName];
		}

		//передаем выбранные теги в коллбек
		if (typeof uiOnly == 'undefined') this.conf.onConfirm(this.tagSelection)
	},

	tagManualInput:function(tagName){

		var prefix = this.prefix[this.conf.tagType];
		var completeTagName = (tagName.charAt(0) == prefix) ? tagName : prefix+tagName;

		// пропускаем только теги длиннее 2 символов
		if (completeTagName.length < 4) {
			alert('tag too short!');
			return false;
		}

		// ничего не делаем, если еще идет ожидание саджеста
		if (this.timeout || this.request) return false;

		// предлагаем юзеру не создавать похожих тегов
		if (this.$suggestBox.is(':visible')) {

			if (!this.$suggestBox.find('[data-tag="'+ completeTagName +'"]').size() && !confirm(t.txt.new_tag_confirm)) return false;
		}

		if (this.$smartArea.find('[data-tag*="'+ tagName +'"]').size() || this.$smartArea.find('[data-tag^="'+ completeTagName +'"]').size()) {
			if (!confirm(t.txt.new_tag_confirm)) return false;
		}

		this.addTagToSelection( tagName );
	}
}
