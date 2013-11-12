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


// умный поиск по тегам
tinng.protos.ui.SearchBox = function(config){
	t.funcs.bind(this);

	// настройки по умолчанию и их перегрузка
	this.conf = t.funcs.objectConfig(config, this.defaultConf = {
		css:'',
		cssClass:'',
		placeholder:'Search...',
		suggest:'on_topics',

		// вызывается когда объект поиска подтверждается тем или иным способом
		onConfirm:function(){}
	});

	// сборка объекта
	this.$body = $('<div class="smart-search"/>');
	if (this.conf.cssClass) this.$body.addClass(this.conf.cssClass);
	if (this.conf.css) this.$body.css(this.conf.css);

	this.$smartArea = $('<div class="smart-area">').appendTo(this.$body);
	this.$input = $('<input type="text" placeholder="'+ this.conf.placeholder +'">').appendTo(this.$body);
	this.$throbber = $('<div class="throbber updating">').appendTo(this.$body);

	this.$input.on('keyup', this.waitAndSuggest);
	this.$input.on('paste', this.suggest);
}

tinng.protos.ui.SearchBox.prototype = {
	suggest:function(){
		var that = this;

		var query = this.$input.val();

		if (query.length > 1) {
			console.log('here goes the query: ', query);

			// todo - возможно, создать обертку вокруг реквеста, которая будет управлять отображением троббера и лагом сама
			// если запрос не возвращается дольше заданного времени (xhr_lag) - показываем троббер
			this.XHRLag = setTimeout(function(){
				that.$throbber.css({visibility:'visible'})
			}, t.cfg.xhr_lag);

			this.request = new JsHttpRequest();
			this.request.onreadystatechange = this.onResponse;
			this.request.open(null, '/backend/suggest.php', true);
			this.request.send({
				suggest: this.conf.suggest,
				subject: query
			});
		}
	},

	onResponse:function(){

		switch (this.request.readyState){

			// success
			case 4:
				console.log('query returned:', this.request.responseJS);
				break;
		}

		this.clearLag();
	},

	onAbort:function(){
		this.clearLag();
	},

	clearLag:function(){
		if (this.XHRLag) clearTimeout(this.XHRLag);
		this.$throbber.css({visibility:'hidden'});
	},

	waitAndSuggest:function(){
		if (this.timeout) clearTimeout(this.timeout);

		// если запрос уже ушел, но еще не вернулся - абортнуть его
		// todo - тут не совсем понятно, точно ли нужен status, потому что у только что отправленного запроса статус - null
		if (this.request && this.request.status) {
			this.request.onreadystatechange = this.onAbort;
			this.request.abort();
		}

		// рестартуем таймер
		this.timeout = setTimeout(this.suggest, t.cfg.xhr_suggest);
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
