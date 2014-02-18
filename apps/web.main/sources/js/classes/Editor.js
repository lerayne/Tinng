/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:55 PM
 * To change this template use File | Settings | File Templates.
 */

// Редактор сообщений
tinng.protos.Editor = function (element) {
	t.funcs.bind(this);

	if (tinng.user.hasRight('writeToTopic', tinng.sync.curTopic)){
		var that = this;
		t.funcs.bind(this, ['submitNew']);

		this.ui = t.chunks.get('editor');
		this.$body = this.ui.$body;
		element.append(this.$body);

        this.ui.$submit.click(this.submitNew);
        this.visible = true;

        this.currentHeight = 0;

		var ckconf = {
			enterMode: CKEDITOR.ENTER_BR
		};

		ckconf.toolbar = [['Bold', 'Italic', 'Strike'],['Blockquote'],['Source']];
		ckconf.on = {
			autogrow:function(e){ console.log('grow:', e)},
			focus:function(e){console.log('focus:', e)}
		}

		this.ck = CKEDITOR.replace(this.ui.$messageBody[0], ckconf);

		//this.ck.on('focus:', function(e){console.log('focus:', e)})



		/*CKEDITOR.on('instanceReady', function(){
			$(that.ck.container.$).on('keyup', that.onKeyPress);
		})*/

		this.ui.$wrapper.on('keyup', this.onKeyPress);

		// todo - мой кейлистенер - полное Г. Переделать.
//		tinng.keyListener.register('ctrl+enter', this, this.submitNew);
//		tinng.keyListener.register('alt+enter', this, this.submitNew);

    } else {
        this.$body = t.chunks.get('editor-disabled').$body;
    }
}

tinng.protos.Editor.prototype = {

	onKeyPress:function(e){
		// todo - разобраться, почему не срабатывает alt+enter (подозение - раскладка бирмана)
		//console.log('key:', e.keyCode,'; alt:', e.altKey, '; ctrl:', e.ctrlKey)

		console.log('keyup', e)

		if (e.keyCode == 10 || ( e.keyCode == 13 && (e.altKey || e.ctrlKey) )){
			this.submitNew();
		}

        if (this.currentHeight != this.$body.height()) {
            this.currentHeight = this.$body.height();
            this.resize();
        }
	},

    submitNew:function () {

        if (this.checkMessage()) {

			var writeObject = {
				message: this.preparedMessage()
			}

			if (t.units.posts.newDialogueMode) {
				writeObject.action = 'add_topic';
				writeObject.title = '';
				writeObject.dialogue = t.units.posts.state.topicData.dialogue;
			} else {
				writeObject.action = 'add_post';
				writeObject.topic = t.units.posts.state.topicData.id;
			}

			// ОТПРАВЛЯЕМ
			t.connection.write(writeObject);

			this.ck.setData('');
			this.ck.focus();

            //this.ui.$messageBody.html('').focus(); // todo - сделать затенение кнопки, если сообщение пустое
        }
    },

    checkMessage:function(){

        var blockThis = false;
        var msg = this.ck.getData();

        if (msg.match(t.rex.empty)) blockThis = 'null length';

        if (blockThis) alert(blockThis);

        return !blockThis;
    },

    preparedMessage:function(){

        var msg = this.ck.getData();

        return msg;
    },

	resize:function(){
		//console.log('editor resize');
		var posts = t.units.posts;
		this.$body.width(posts.ui.$content.width());

		var wasAtBottom = posts.atBottom; // не убирать! строка ниже меняет значение этого вызова!
		posts.ui.$contentWrap.css('padding-bottom', this.$body.offsetHeight());

		if (wasAtBottom && !posts.atTop) {
			posts.scrollToBottom();
		}
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
