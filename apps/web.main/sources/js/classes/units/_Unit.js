/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include apps/web.main/sources/js/classes/Class.js
 */

tinng.protos.Unit = Class({

	initialize: function (data) {
		this.construct(data);
	},

	construct: function (data) {

		t.funcs.bind(this, [
			'onScroll',
			'toggleActive'
		])

		/* СБОР */

		this.data = data;

		this.active = true;

		this.contentLoaded = 0;

		this.subscriptions = {};

		// todo - переделать под чанки
		var $body = this.$body = t.chunks.get('unit');
		this.$scrollArea = $body.find('.scroll-area');
		this.$contentWrap = $body.find('.content-wrap');
		this.$content = $body.find('.content');
		this.$header = $body.find('header');
		this.$footer = $body.find('footer');

		/* ОБРАБОТКА */

		$body.addClass(data.name);
		if (data.css) $body.css(data.css);

		if (data.minimizeButton) data.minimizeButton.click(this.toggleActive)

		// привязка событий прокрутки
		this.$scrollArea.on('scroll', this.onScroll);
		this.$scrollArea.scroll();
	},

	placeTo:function(container){
		// todo - здесь можно также инициализировать юнит
		container.append(this.$body);
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
		var height = num - this.$header.offsetHeight() - this.$footer.offsetHeight();
		this.scrollAreaH = height;
		this.$scrollArea.height(height);
	},

	addNode: function (node) {
		this.$content.append(node.$body);
	},

	addNodeOnTop: function (node) {
		this.$content.prepend(node.$body);
	},

	scrollToTop: function () {
		this.$contentWrap[0].scrollIntoView(true);
	},

	scrollToBottom: function () {
		//console.log('scroll to bottom');
		this.$contentWrap[0].scrollIntoView(false);
	},

	onScroll: function () {
		this.scrolledBy = this.$scrollArea.scrollTop();

		this.atBottom = this.scrollAreaH + this.scrolledBy - this.$contentWrap.offsetHeight() >= 0;
		this.atTop = this.scrolledBy == 0;
	},

	clear: function () {
		//todo проверить полное удаление из памяти
		this.$content.children().remove();
		this.stopWaitIndication();
	},

	isClear: function () {
		return !this.$content.children().size();
	},

	startWaitIndication: function () {
		this.clear();
		this.$scrollArea.addClass('loading');
	},

	stopWaitIndication: function () {
		this.$scrollArea.removeClass('loading');
	},

	parseFeed: function (feed) {
		console.log('this is only a placeholder for "parseFeed". Feeds are: ', feed)
	}
});
