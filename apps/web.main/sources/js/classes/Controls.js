/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:52 PM
 * To change this template use File | Settings | File Templates.
 */

tinng.protos.ui.Field = function (data) {
    this.$body = $('<div/>');

    if (data.label) this.label = data.label;

    if (data.id) this.$body.attr('id', data.id);
    if (data.cell) this.$body.attr('data-cell', data.cell);
    if (data.cssClass) this.$body.addClass(data.cssClass);
    if (data.css) this.$body.css(data.css);
}

tinng.protos.ui.Button = function (data) {

    this.$body = $('<div/>');
    this.$button = $('<div/>');
    this.$body.append(this.$button);

    if (data.label) this.label = data.label;

    this.$button.addClass('button');

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

        this.$button.on('mouseover', this.waitTip);
        this.$button.on('mouseout', this.hideTip);
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

tinng.protos.ui.Panel = function (dataArray) {

    this.$body = $('<div/>');
    this.$body.addClass('panel revealer3');

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
