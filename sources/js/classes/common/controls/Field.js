/**
 * Created by M. Yegorov on 1/13/14.
 */

// Поле
tinng.protos.ui.Field = function (data) {
	this.$body = $('<div/>');

	if (data.label) this.label = data.label;

	if (data.id) this.$body.attr('id', data.id);
	if (data.cell) this.$body.attr('data-cell', data.cell);
	if (data.cssClass) this.$body.addClass(data.cssClass);
	if (data.css) this.$body.css(data.css);

	if (data.text) this.$body.text(data.text);
	if (data.html) this.$body.html(data.html);
}
