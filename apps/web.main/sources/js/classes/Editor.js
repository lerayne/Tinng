/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:55 PM
 * To change this template use File | Settings | File Templates.
 */

// Редактор сообщений
tinng.protos.Editor = function () {
	t.funcs.bind(this);

	if (tinng.user.hasRight('writeToTopic', tinng.sync.curTopic)){

        var $body = this.$body = t.chunks.get('editor');

        this.$submit = $body.find('.submit.button');
        this.$messageBody = $body.find('.textarea');
        this.$messageTitle = $body.find('.title');

        this.submitNew = $.proxy(this, 'submitNew');

        this.$submit.click(this.submitNew);
        this.visible = true;

		this.$messageBody.on('keypress', this.onKeyPress)

		// todo - мой кейлистенер - полное Г. Переделать.
//		tinng.keyListener.register('ctrl+enter', this, this.submitNew);
//		tinng.keyListener.register('alt+enter', this, this.submitNew);

    } else {
        var $body = this.$body = t.chunks.get('editor-disabled');
    }
}

tinng.protos.Editor.prototype = {

	onKeyPress:function(e){
		// todo - разобраться, почему не срабатывает alt+enter (подозение - раскладка бирмана)
		//console.log('key:', e.keyCode,'; alt:', e.altKey, '; ctrl:', e.ctrlKey)
		if (e.keyCode == 10 || ( e.keyCode == 13 && (e.altKey || e.ctrlKey) )){
			this.submitNew();
		}
	},

    submitNew:function () {

        if (this.checkMessage()) {

			switch (t.units.posts.newTopicMode) {
				case true:

					t.rotor.start('add_topic', {
						message: this.preparedMessage(),
						title: t.units.posts.header.topicName.$body.text()
					});

				break;
				default:

					t.rotor.start('add_post', {
						message:this.preparedMessage(),
						title:''
					});
			}

            this.$messageBody.html(''); // todo - сделать затенение кнопки, если сообщение пустое
            this.$messageTitle.val('');
        }
    },

    checkMessage:function(){

        var blockThis = false;
        var msg = this.$messageBody.text();

        if (msg.match(t.rex.empty)) blockThis = 'null length';

        if (blockThis) alert(blockThis);

        return !blockThis;
    },

    preparedMessage:function(){

        var msg = this.$messageBody.html()

        return msg;
    },

	resize:function(){
		var posts = t.units.posts;
		this.$body.width(posts.$content.width());

		var wasAtBottom = posts.atBottom; // не убирать! строка ниже меняет значение этого вызова!
		posts.$contentWrap.css('padding-bottom', this.$body.offsetHeight());
		if (wasAtBottom) posts.scrollToBottom();
	},

	hide:function(){
		var wasAtBottom = t.units.posts.atBottom;
		this.$body.hide();
		this.visible = false;
		this.resize();
		if (wasAtBottom) t.units.posts.scrollToBottom();
	},

	show:function(){
		var wasAtBottom = t.units.posts.atBottom;
		this.$body.show();
		this.visible = true;
		this.resize();
		if (wasAtBottom) t.units.posts.scrollToBottom();
	}
}
