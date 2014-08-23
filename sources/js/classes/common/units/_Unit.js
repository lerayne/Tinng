/**
 * Created by Michael on 23.08.14.
 * @include ./sources/js/classes/common/Class.js
 */

tinng.protos.Unit = Class({
	initialize:function(data){
		this.construct(data);
	},

	construct:function(data){
		this.data = data;
		this.active = false;

		t.funcs.bind(this, [
			'toggleActive'
		])

		this.ui = t.chunks.get('unit');
		var $body = this.$body = this.ui.$body;

		$body.addClass(data.name);
		if (data.css) $body.css(data.css);
	},

	placeTo:function(container){

		// ИНИЦИАЛИЗАЦИЯ
		this.nullify();

		container.append(this.$body);
	},

	activate:function(){
		this.active = true;

		this.ui.$body.addClass('active');

		if (this.data.activateCallback) this.data.activateCallback();
	},

	toggleActive:function(){
		if (this.active) this.deactivate();
		else this.activate();
	},

	deactivate:function(){
		this.active = false;

		this.ui.$body.removeClass('active');

		if (this.data.deactivateCallback) this.data.deactivateCallback();
	},

	nullify:function(){
		this.state = {};
		this.contentLoaded = false;
		this.subscriptions = {};

		this.ui.$content.children().remove();
		this.stopWaitIndication();
	},

	addNode: function (node) {
		this.ui.$content.append(node.$body);
	},

	addNodeOnTop: function (node) {
		this.ui.$content.prepend(node.$body);
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

	onScroll:function(){

	},

	scrollToTop: function () {
		this.ui.$contentWrap.scrollIntoView(true);
		this.onScroll();
	},

	scrollToBottom: function () {
		this.ui.$contentWrap.scrollIntoView(false);
		this.onScroll();
	},

	parseFeed: function (feed) {
		console.log('this is only a placeholder for "parseFeed". Feeds are: ', feed)
	}
})
