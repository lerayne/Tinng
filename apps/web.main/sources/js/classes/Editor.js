/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:55 PM
 * To change this template use File | Settings | File Templates.
 */

// Редактор сообщений
tinng.protos.Editor = function () {
    var $body = this.$body = this.tinng.chunks.get('editor');

    this.$submit = $body.find('.submit.button');
    this.$messageBody = $body.find('.textarea');
    this.$messageTitle = $body.find('.title');

    this.submitNew = $.proxy(this, 'submitNew');

    this.$submit.click(this.submitNew);
	this.visible = true;
}

tinng.protos.Editor.prototype = {
    tinng:tinng,

    submitNew:function () {
        var t = this.tinng;

        if (this.checkMessage()) {
            t.rotor.start('add_post', {
                message:this.preparedMessage(),
                title:this.$messageTitle.val()
            });

            this.$messageBody.html(''); // todo - сделать затенение кнопки, если сообщение пустое
            this.$messageTitle.val('');
        }
    },

    checkMessage:function(){
        var t = this.tinng;

        var blockThis = false;
        var msg = this.$messageBody.text();

        if (msg.replace(t.rex.empty, '').length == 0) blockThis = 'null length';

        if (blockThis) alert(blockThis);

        return !blockThis;
    },

    preparedMessage:function(){

        var msg = this.$messageBody.html()

        return msg;
    },

	resize:function(){
		var posts = this.tinng.units.posts;
		this.$body.width(posts.$content.width());

		var wasAtBottom = posts.atBottom; // не убирать! строка ниже меняет значение этого вызова!
		posts.$contentWrap.css('padding-bottom', this.$body.offsetHeight());
		if (wasAtBottom) posts.scrollToBottom();
	},

	hide:function(){
		var wasAtBottom = this.tinng.units.posts.atBottom;
		this.$body.hide();
		this.visible = false;
		this.resize();
		if (wasAtBottom) this.tinng.units.posts.scrollToBottom();
	},

	show:function(){
		var wasAtBottom = this.tinng.units.posts.atBottom;
		this.$body.show();
		this.visible = true;
		this.resize();
		if (wasAtBottom) this.tinng.units.posts.scrollToBottom();
	}
}
