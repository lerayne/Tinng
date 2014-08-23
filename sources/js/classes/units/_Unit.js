/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include ./sources/js/classes/Class.js
 */

tinng.protos.Unit = Class({

	initialize: function (data) {
		this.construct(data);
	},

	construct: function (data) {
		var that = this;

		t.funcs.bind(this, [
			'onScroll',
			'toggleActive'
		])

		/* СБОР */

		this.data = data;
		this.active = true;

		this.ui = t.chunks.get('unit');
		var $body = this.$body = this.ui.$body;

		/* ОБРАБОТКА */

		$body.addClass(data.name);
		if (data.css) $body.css(data.css);

		if (data.minimizeButton) data.minimizeButton.click(this.toggleActive);

		// привязка событий прокрутки
		this.ui.$scrollArea.on('scroll', this.onScroll);
		this.ui.$scrollArea.scroll();

		// выпадающее меню
		this.ui.$body.addClass('with-settings');
		this.settingsBtn = new t.protos.ui.Button(
			{label:'settingsBtn', cssClass:'right', icon:'gear_white.png', tip: t.txt.unit_settings}
		);
		this.settingsBtn.$body.appendTo(this.ui.$settingsBtn);
		this.settingsBtn.on('click', function(){
			that.settingsBtn.freeze();
			that.ui.$settingsDropdown.show();
		})
		this.ui.$settingsMenu.on('mouseleave', function(){
			that.settingsBtn.unfreeze();
			that.ui.$settingsDropdown.hide();
		})
	},

	nullify:function(){
		this.state = {};
		this.contentLoaded = false;
		this.subscriptions = {};

		this.ui.$content.children().remove();
		this.stopWaitIndication();

		this.refreshMenu();
	},

	refreshMenu:function(){
		if (!this.ui.$settingsDropdown.children().not('.none').size()) this.ui.$body.removeClass('with-settings');
		else this.ui.$body.addClass('with-settings');
	},

	placeTo:function(container){

		// ИНИЦИАЛИЗАЦИЯ
		this.nullify();

		container.append(this.$body);

		this.activate();
	},

	toggleActive:function(){
		if (this.active) this.deactivate();
		else this.activate();
	},

	activate:function(){
		this.active = true;

		if (this.data.activateCallback) this.data.activateCallback();
	},

	deactivate:function(){
		this.active = false;

		if (this.data.deactivateCallback) this.data.deactivateCallback();
	},

	setHeight: function (num) {
		var height = num - this.ui.$header.offsetHeight() - this.ui.$footer.offsetHeight();
		this.scrollAreaH = height;
		this.ui.$scrollArea.height(height);
	},

	addNode: function (node) {
		this.ui.$content.append(node.$body);
	},

	addNodeOnTop: function (node) {
		this.ui.$content.prepend(node.$body);
	},

	scrollToTop: function () {
		this.ui.$contentWrap.scrollIntoView(true);
		this.onScroll();
	},

	scrollToBottom: function () {
		this.ui.$contentWrap.scrollIntoView(false);
		this.onScroll();
	},

	onScroll: function () {
		this.scrolledBy = this.ui.$scrollArea.scrollTop();

		this.atBottom = this.scrollAreaH + this.scrolledBy - this.ui.$contentWrap.offsetHeight() >= 0;
		this.atTop = this.scrolledBy == 0;
	},

	isClear: function () {
		return !this.ui.$content.children().size();
	},

	startWaitIndication: function () {
		this.ui.$scrollArea.addClass('loading');
	},

	stopWaitIndication: function () {
		this.ui.$scrollArea.removeClass('loading');
	},

	parseFeed: function (feed) {
		console.log('this is only a placeholder for "parseFeed". Feeds are: ', feed)
	}
});
