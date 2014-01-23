/**
 * Created by M. Yegorov on 1/13/14.
 */

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
