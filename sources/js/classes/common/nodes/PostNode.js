/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include _Node.js
 */

tinng.protos.PostNode = Class(tinng.protos.Node, {

	construct:function (data) {
		var that = this;

		t.funcs.bind(this, [
			'edit',
			'enterEditMode',
			'erase',
			'unlock',
			'save',
			'cancelEdit',
			'forceUnread',
			'select',
			'kill',
			'quote'
		])

		t.protos
			.Node.prototype
			.construct.call(this, data, 'post');

		this.$body.attr('data-topic', data.topic_id);

		this.$body.click(this.select);
		this.$body.on('click', 'a', function(e){e.stopPropagation()});
		//this.cells.$message.on('click', this.select);

		/* Панель действий */

		// todo - каждую кнопку формировать и навешивать на нее действие отдельно, в зависимости от прав

		this.mainPanel = new t.protos.ui.Panel([
			{type:'Button', label:'quote', icon:'quote_message.png', text:t.txt.make_quote},
			{type:'Button', label:'edit', icon:'doc_edit.png', text:t.txt.edit},
			{type:'Button', label:'delete', icon:'doc_delete.png', text:t.txt['delete']},
			{type:'Button', label:'unlock', icon:'padlock_open.png', text:t.txt.unblock},
			{type:'Button', label:'mark_unread', icon:'message_unread.png', text: t.txt.mark_next_unread}
		]);

		this.cells.$controls.append(this.mainPanel.$body);

		this.mainPanel.unlock.$body.hide();

		this.mainPanel.quote.on('click', this.quote)
		this.mainPanel.edit.on('click', this.edit);
		this.mainPanel.edit.on('click', this.hideMenu);
		//this.cells.$message.on('dblclick', this.edit);
		//this.mainPanel.edit.on('click', t.funcs.stopProp);
		this.mainPanel['delete'].on('click', this.erase);
		//this.mainPanel['delete'].on('click', t.funcs.stopProp);
		this.mainPanel.unlock.on('click', this.unlock);
		this.mainPanel.mark_unread.on('click', this.forceUnread);


		// права (todo - сделать наоборот!)
		if (!t.user.hasRight('writeToTopic', this.data.topic_id || this.data.id)) this.mainPanel.quote.$body.remove();
		if (!t.user.hasRight('editMessage', this.data)) this.mainPanel.edit.$body.remove();
		if (!t.user.hasRight('deleteMessage', this.data) || (data.head && data.dialogue > 0)) this.mainPanel['delete'].$body.remove();
		if (!t.user.hasRight('admin', this)) this.mainPanel.unlock.$body.remove();
		if (this.data.author_id == t.user.id) this.mainPanel.mark_unread.$body.remove();
		// todo - тема, вручную отмеченная непрочитанной не отмечается таковой в списке тем, если последний пост в ней - текущего юзера
		if (!t.user.hasRight('readMessage', this)) this.mainPanel.mark_unread.$body.remove();

		/* панель редактирования */

		this.editorPanel = new t.protos.ui.Panel([
			{type:'Button', label:'cancel', cssClass:'right', icon:'cancel.png', text:t.txt.cancel},
			{type:'Button', label:'save', cssClass:'right', icon:'round_checkmark.png', text:t.txt.save}
		]);

		this.editorPanel.$body.hide();
		if (t.user.hasRight('editMessage', this.data)) this.cells.$controls2.append(this.editorPanel.$body);

		this.editorPanel.save.on('click', this.save);
		this.editorPanel.cancel.on('click', this.cancelEdit);

		// снятие статуса непрочитанности
		this.mousetimer = 0;
		this.$body.mouseenter(function(){
			this.mousetimer = setTimeout(that.pushReadState, 300);
		});
		this.$body.mouseleave(function(){
			clearTimeout(this.mousetimer);
		});

		if (!data.head && data.dialogue == 0) {
			this.$body.draggable({
				helper:'clone',
				handle:this.cells.$infobar,
				appendTo:'#tinng-main-content',
				distance:5,
				scroll:false,

				start:function(e, ui){
					if (t.user.id != t.units.posts.state.topicData.author_id && t.user.id != 1) return false;

					ui.helper.width(that.$body.width());
				}
			})
		}
	},

	// заполнить сообщение данными
	fill:function (data) {
		t.protos
			.Node.prototype
			.fill.apply(this, arguments);

		this.cells.$avatar.attr('src', data.avatar);
		this.cells.$avatar_box.addClass('user-'+data.author_id);

		// отмечаем сообщения непрочитанными
		if (this.data.unread == '1') this.markUnread();

		this.updateMenu();
	},

	// пометить сообщение выделенным
	select:function () {

		var selected = t.state.selectedPost;

		if (!selected || selected.id != this.id) {
			if (selected) selected.deselect();

			t.state.selectedPost = this;
			this.$body.addClass('selected');
			t.address.set('post', this.id);
		} else if (selected.id == this.id) {
			this.deselect('full');
		}

		return false;
	},

	// отменяет выделение
	deselect:function (full) {
		this.$body.removeClass('selected');

		// если после этого сразу не будет новое выделение
		if (full) {
			delete(t.state.selectedPost);
			t.address.del('post');
		}
	},

	// демонстрирует удаление ноды в интерфейсе и вызывает окончательное удаление
	remove:function () {
		this.deselect();
		this.$body.css({overflow:'hidden'});
		this.$body.animate({opacity:0, height:0}, 400, this.kill);
	},

	// окончательно удаляет ноду
	kill:function () {
		this.$body.remove();
		delete(t.posts[this.id]);
	},

	quote:function(){
		t.ui.editor.ck.insertHtml('' +
			'<blockquote data-origin="'+ this.data.id +'">' +
			'	<cite>'+ t.txt.quote_before +'<strong>'+ this.data.author +'</strong>'+ t.txt.quote_after +'</cite>' +
			'	'+ this.data.message +
			'	<footer>; '+ (t.user.data.display_name || t.user.data.login) + t.txt.user_answers +' </footer>' +
			'</blockquote>' +
			'<p></p>'

			, 'unfiltered_html'
		);
	},

	// прокручивает список до данного сообщения
	show:function (begining) {

		//console.log('post show:', this.data.id);

		t.protos.Node.prototype
			.show.apply(this, arguments);

		var thisLast = this.$body.next().size() == 0;

		if (begining == false) {
			var $postsU = t.units.posts;
			if (!thisLast)
				$postsU.ui.$scrollArea.scrollTop($postsU.ui.$scrollArea.scrollTop() + parseInt($postsU.ui.$contentWrap.css('padding-bottom')));
			else
				$postsU.scrollToBottom();
		}
	},

	// начинает редактирование с проверки блокировки
	edit:function () {

		t.connection.query('service', this.enterEditMode, {
			action:'check_n_lock',
			id:this.id
		});

		return false; // preventDefault + stopPropagation
	},

	// демонстрирует блокировку, или входит в режим редактирования
	enterEditMode:function (result) {
		var that = this;

		if (result.locked !== null) {

			if (t.user.id == '1') {
				if (confirm(t.txt.post_locked + '\n' + t.txt.post_locked_admin)) {
					this.unlock()
				} else {
					this.mainPanel.unlock.$body.show();
				}
			} else alert(t.txt.post_locked);

		} else {

			this.messageBackup = this.cells.$message.html();
			var wasAtBottom = t.units.posts.atBottom;
			console.log('wasAtBottom', wasAtBottom)

			this.hideMenu();
			this.cells.$menuBtn.hide();

			// если это заглавное сообщение и не диалог - добавляем редактор тегов
			if (this.data.head && this.data.dialogue == 0) {
				this.cells.$tags.hide();

				this.data.newTags = this.data.tags ? this.data.tags.map(function(val){return val.name}) : [];

				this.tagEditBox = new t.protos.ui.SearchBox({
					tags:this.data.tags,
					tagsOnly:true,
					placeholder:t.txt.enter_tags,
					onConfirm:function(tags){
						that.data.newTags = tags;
					}
				});

				this.tagEditBox.$body.appendTo(this.cells.$tags_edit)

				this.cells.$tags_edit.show();
			}

			this.editorPanel.$body.show();

			var ckconf = {
				enterMode: CKEDITOR.ENTER_BR,
				toolbarLocation:'bottom',
				extraAllowedContent: 'cite footer blockquote[data-origin]',
				height:'auto'
			};

			//ckconf.toolbar = [['Bold', 'Italic', 'Strike', '-', 'RemoveFormat', '-', 'Blockquote', '-','Link', 'Unlink', '-','Source']];

			this.editor = CKEDITOR.replace(this.cells.$message[0], ckconf);
			this.editor.focus();

			this.editor.on('instanceReady', function(){
				if (wasAtBottom && that.$body.is(':last-child')) t.units.posts.scrollToBottom();
			})

			//this.cells.$message.attr('contenteditable', true);
			//this.cells.$message.focus();
		}
	},

	// срабатывает при отмене редактирования
	cancelEdit:function () {

		this.exitEditMode();
		this.cells.$tags.show();

		this.unlock();
		this.cells.$message.html(this.messageBackup);
		this.messageBackup = '';

		return false; // preventDefault + stopPropagation
	},

	// выходит из режима редактирования
	exitEditMode:function () {
		this.cells.$menuBtn.show();
		this.cells.$tags_edit.hide().children().remove();
		this.editorPanel.$body.hide();
		//this.mainPanel.$body.show();
		//this.cells.$message.removeAttr('contenteditable');
		this.cells.$message.html(this.editor.getData())
		this.editor.destroy();
	},

	// срабатывает при нажатии кнопки "сохранить" в режиме редактирования
	save:function () {

		console.log('write tags:', this.data.newTags)

//		var newContent = this.cells.$message.html();
		var newContent = this.editor.getData();

		if (!newContent.match(t.rex.empty)) {
			t.connection.write({
				action: 'update_message',
				id:this.id,
				message:newContent,
				tags:this.data.newTags
			});
			this.exitEditMode();
		} else alert('null length!')


		return false; // preventDefault + stopPropagation
	},

	// срабатывает при нажатии кнопки "удалить" в режиме редактировая
	erase:function () {

		if (confirm(t.txt.msg_del_confirm)) {
			t.connection.write({action: 'delete_message', id:this.id});
		}

		return false; // preventDefault + stopPropagation
	},

	// принудительная запрос разблокировки. Без подтверждения
	unlock:function () {
		t.connection.query('service', null, { // аргументы:
			action:'unlock_message',
			id:this.id
		});

		this.mainPanel.unlock.$body.hide();

		return false; // preventDefault + stopPropagation
	},

	markRead:function(){

		if (this.data.unread != 0) {
			console.log('trigger unread', this.data);

			$.event.trigger({
				type: 'read_topic',
				message: this.data
			})
		}

		t.protos
			.Node.prototype
			.markRead.apply(this, arguments);
	},

	markUnreadNext:function(){
		for (var key in t.posts) {
			if (key >= this.data.id && t.posts[key].data.author_id != t.user.id) {
				t.posts[key].markUnread();
			}
		}
	},

	markReadPrev:function(){
		for (var key in t.posts) {
			if (key <= this.data.id && t.posts[key].data.author_id != t.user.id) {
				t.posts[key].markRead();
			}
		}
	},

	pushReadState:function(){
		if (this.data.unread == '1') {

			var latestReadTS = this.data.modified ? t.funcs.sql2stamp(this.data.modified) : t.funcs.sql2stamp(this.data.created);

			t.stateService.push({
				action:'read_topic',
				id: this.data.topic_id == 0 ? this.data.id : this.data.topic_id,
				time: latestReadTS,
				author: this.data.author_id,
				dialogue: this.data.dialogue
			});

			this.markReadPrev();
		}
	},

	forceUnread:function(){
		var latestReadTS = t.funcs.sql2stamp(this.data.created);

		t.stateService.push({
			action:'read_topic',
			id: this.data.topic_id == 0 ? this.data.id : this.data.topic_id,
			time: latestReadTS - 2000
		});

		t.stateService.flushState();

		// todo - второе условие введено, чтобы не обманывать пользователя из-за ошибки
		if (t.topics[this.data.topic_id] && t.topics[this.data.topic_id].data.lastauthor_id != t.user.id) {
			t.topics[this.data.topic_id].markUnread();
		}

		this.markUnreadNext();
	}
});
