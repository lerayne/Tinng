/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 4:44 PM
 * To change this template use File | Settings | File Templates.
 */

/* КЛАСС ТЕГА */

tinng.protos.Tag = function (data) {
	this.$body = t.chunks.get('tag');
	this.$body.text(data.name);
}

tinng.protos.Tag.prototype = {

}
