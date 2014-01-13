/**
 * Created by M. Yegorov on 1/13/14.
 */

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
