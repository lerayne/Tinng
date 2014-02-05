/**
 * Created by M. Yegorov on 1/13/14.
 */

// тег (визуальное представление)
tinng.protos.ui.Tag = function (data, callbacks) {
	this.data = data;
	this.ui = t.chunks2.get('tag');
	this.$body = this.ui.$body;

	if (this.data.operation) {
		this.$body.addClass('operational')
		this.ui.$operation.text(this.data.operation).show();
	}

	if (this.data.used === '0') {
		this.$body.addClass('unused');
	}

	this.ui.$text.text(data.name);
	this.$body.attr('data-tag', data.name);

	if (typeof callbacks != 'undefined'){
		if (callbacks.bodyClick) {
			this.$body.click(callbacks.bodyClick);
			this.$body.addClass('clickable');
		}
		if (callbacks.closeClick) {
			this.ui.$close.show();
			this.ui.$close.click(callbacks.closeClick)
		}
	}
}

tinng.protos.ui.Tag.prototype = {
	removeOperation:function(){
		this.$body.removeClass('operational')
		this.ui.$operation.hide();
	}
}
