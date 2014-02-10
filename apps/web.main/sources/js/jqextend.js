/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:45 PM
 * To change this template use File | Settings | File Templates.
 */


jQuery.fn.extend({

	'offsetHeight':function () {
		return this[0].offsetHeight;
	},

	'offsetWidth':function () {
		return this[0].offsetWidth;
	},

	scrollIntoView:function(alignWithTop) {

		if (typeof alignWithTop == 'undefined') {
			return this[0].scrollIntoView()
		} else {
			return this[0].scrollIntoView(alignWithTop)
		}
	}
});
