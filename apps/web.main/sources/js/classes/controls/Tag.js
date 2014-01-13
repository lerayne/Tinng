/**
 * Created by M. Yegorov on 1/13/14.
 */

// тег (визуальное представление)
tinng.protos.ui.Tag = function (data, callbacks) {
	this.data = data;
	this.$body = t.chunks.get('tag');

	var textContainer = this.$body.find('[data-cell="text"]');
	var closeButton = this.$body.find('[data-cell="close"]');

	textContainer.text(data.name);
	this.$body.attr('data-tag', data.name);

	if (typeof callbacks != 'undefined'){
		if (callbacks.bodyClick) {
			this.$body.click(callbacks.bodyClick)
		}
		if (callbacks.closeClick) {
			closeButton.show();
			closeButton.click(callbacks.closeClick)
		}
	}
}

tinng.protos.ui.Tag.prototype = {

}
