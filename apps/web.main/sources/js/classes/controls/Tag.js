/**
 * Created by M. Yegorov on 1/13/14.
 */

// тег (визуальное представление)
tinng.protos.ui.Tag = function (data, callbacks) {
	this.data = data;
	this.$body = t.chunks.get('tag');
	this.$operation = this.$body.find('[data-cell="operation"]');

	var textContainer = this.$body.find('[data-cell="text"]');
	var closeButton = this.$body.find('[data-cell="close"]');

	if (this.data.operation) {
		this.$body.addClass('operational')
		this.$operation.text(this.data.operation).show();
	}

	if (this.data.used === '0') {
		this.$body.addClass('unused');
	}

	textContainer.text(data.name);
	this.$body.attr('data-tag', data.name);

	if (typeof callbacks != 'undefined'){
		if (callbacks.bodyClick) {
			this.$body.click(callbacks.bodyClick);
			this.$body.addClass('clickable');
		}
		if (callbacks.closeClick) {
			closeButton.show();
			closeButton.click(callbacks.closeClick)
		}
	}
}

tinng.protos.ui.Tag.prototype = {
	removeOperation:function(){
		this.$body.removeClass('operational')
		this.$operation.hide();
	}
}
