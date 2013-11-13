/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:45 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {
    $.fn.extend({
        'offsetHeight':function () {
            return this[0].offsetHeight;
        }
    });

    $.fn.extend({
        'offsetWidth':function () {
            return this[0].offsetWidth;
        }
    });
})(jQuery);
