/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:43 PM
 * To change this template use File | Settings | File Templates.
 */

Funcs = function () {
};

Funcs.prototype = {

    // функция ошибки сеттера для финальных свойств
    setterError:function () {
        throw('trying to overwrite final property');
    },


    // запись в консоль
    log:function (text) {


        if (t.cfg['logging']) {
            var date = new Date(), time;

            if (date.toLocaleFormat) {
                time = date.toLocaleFormat('%H:%M:%S');
            } else {
                var temp = {};
                temp.H = date.getHours();
                temp.M = date.getMinutes();
                temp.S = date.getSeconds();
                for (var i in temp) {
                    if (temp[i] * 1 < 10) temp[i] = '0' + temp[i];
                }
                time = temp.H + ':' + temp.M + ':' + temp.S;
            }
            console.info(time + ' - ' + text);
        }
    },


    // обработчик таймаута
    advClearTimeout:function (timeout) {
        if (timeout) {
            this.log('timeout found: ' + timeout + '. cleared', 1);
            clearTimeout(timeout);
        }
        return false;
    },


    // оздать таймстамп из строки с SQL
    sql2stamp:function (str) {
        if (!str) return false;
        var str1 = str.split(' ');
        var dates = str1[0].split('-');
        var times = str1[1].split(':');
        return new Date(dates[0], dates[1] - 1, dates[2], times[0], times[1], times[2]).getTime();
    },

    stopProp:function(e){
        e.stopPropagation();
//		var e = e || window.event;
//		e.stopPropagation ? e.stopPropagation() : (e.cancelBubble=true);
    },

    loadMore:function(pageLimit){

        t.sync.plimit = pageLimit;
        t.address.set('plimit', pageLimit);
        t.rotor.start('next_page');
    },

	unloadTopic: function () {

		if (t.state.selectedPost) t.state.selectedPost.deselect('full');
		t.units.posts.clear();
		t.posts = {};
		t.sync.curTopic = 0;
		t.sync.pglimdateTS = 0;
		t.sync.plimit = 1;
		t.units.posts.contentLoaded = 0;
	},


	topicDeselect:function () {
		$('.topics .active').removeClass('active');
	}
}

tinng.funcs = new Funcs();
