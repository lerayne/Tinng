/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 4:47 PM
 * To change this template use File | Settings | File Templates.
 */

/* КЛАССЫ НОДЫ, ТЕМЫ И ПОСТА */

tinng.protos.Node = Class({

	initialize:function (data, chunkName, addCells) {
		this.construct(data, chunkName, addCells);
		this.fill(data);
	},

	construct:function (data, chunkName, addCells) {
		var that = this;
		t.funcs.bind(this, ['markRead', 'pushReadState', 'toggleMenu', 'hideMenu']);

		this.$body = t.chunks.get(chunkName || 'node');

		// создаем поля главного объекта на основе данных
		this.data = data;
		this.id = parseInt(data.id);

		// заполняем коллекцию cells на основе названий полей
		var cells = [

			'infobar',
			'created',
			'author',
			'id',
			'message',
			'controls',
			'controls2',
            'menuBtn',
			'tags'

		].concat(addCells || []);

		this.cells = {};
		for (var i in cells) this.cells['$' + cells[i]] = this.$body.find('[data-cell="' + cells[i] + '"]');

        // универсальные управления событиями
		// todo - закончить
		this.cells.$controls.on('click', '.button', function(){
			console.log('hide')
		});
		this.cells.$menuBtn.on('click', this.toggleMenu);
		this.$body.on('click mouseleave', this.hideMenu);



		// заполняем неизменные данные, присваеваемые единожды
		this.$body.attr('id', chunkName + '_' + data.id);
		this.$body.attr('data-number', data.id);
		this.cells.$message.addClass('message_' + data.id);
		if (!t.cfg.production) this.cells.$id.text(data.id);
	},

	// заполнить данными
	fill:function (data) {
		var that = this;

		this.data = data;

		// общие поля
		this.cells.$message.html(data.message);
		this.cells.$created.text(data.modified ? t.txt.modified + data.modified : data.created);
		this.cells.$author.text(data.author);

		// вбиваем теги
		//todo: сейчас теги при каждом филле обнуляются и вбиваются заново. непорядок
		if (data.tags) {
			this.cells.$tags.children().remove();

			data.tags.forEach(function(val, i){

				var tag = new t.protos.ui.Tag(val, {
					bodyClick:function(){
						t.units.topics.searchBox.addTagToSelection(val.name)
					}
				})
				that.cells.$tags.append(tag.$body);
			})

			this.cells.$tags.show();
		}
	},

	updateMenu:function(){
		// если в меню нет кнопок - спрятать стрелочку
		if (!this.cells.$controls.find('.button-body').not('.none').size()) this.cells.$menuBtn.hide();
		else this.cells.$menuBtn.show();
	},

	show:function (start) {
		this.$body[0].scrollIntoView(start);
	},

	markRead:function(){
		this.$body.removeClass('unread');
		this.data.unread = '0';
	},

	markUnread:function(){
		this.$body.addClass('unread');
		this.data.unread = '1';
	},

    toggleMenu:function(){
		if (this.cells.$controls.children().size()){
			this.cells.$controls.toggle();
		}
        return false;
    },

	hideMenu:function(){
		this.cells.$controls.hide();
		return false;
	}
});




tinng.protos.TopicNode = Class(tinng.protos.Node, {

	construct:function (data) {
		t.funcs.bind(this, [
			'loadPosts',
			'kill',
			'forceRead'
		])

		t.protos
			.Node.prototype
			.construct.call(this, data, 'topic',
			[
				'lastmessage',
				'topicname',
				'postsquant'
			]
		);

		// вешаем обработчики событий
		this.$body.on('click', this.loadPosts);

		this.mainPanel = new t.protos.ui.Panel([
			{type:'Button', label:'mark_read', icon:'message_read.png', text: t.txt.mark_read}
		]);

		this.mainPanel.mark_read.$body.addClass('none');
		this.mainPanel.mark_read.on('click', this.forceRead);

		this.cells.$controls.append(this.mainPanel.$body);
	},

	// заполнить данными
	fill:function (data) {

		t.protos
			.Node.prototype
			.fill.apply(this, arguments);

		this.cells.$postsquant.text(data.postsquant + t.txt.msgs);
		this.cells.$topicname.html(data.topic_name);

		// последнее сообщение
		if (data.last_id) {
			this.cells.$lastmessage.html(
				'<div><b>' + data.lastauthor + ':</b> ' + data.lastpost + '</div>'
			);
		}

		// отмечаем темы непрочитанными
		if (this.data.unread == '1') {
			this.markUnread();
			this.mainPanel.mark_read.$body.removeClass('none');
		}

		this.updateMenu();
	},

	markRead:function(){
		t.protos.Node.prototype
			.markRead.apply(this, arguments);

		this.mainPanel.mark_read.$body.addClass('none');

		this.updateMenu();
	},

	// изменить положение в списке при обновлении
	bump:function () {
		var topics = t.units.topics;

		switch (t.sync.topicSort) {

			// сортировка по последнему обновлению
			case 'updated':
				//this.detach(); // - нет необходимости

				if (t.sync.tsReverse) {
					topics.addNodeOnTop(this)
				} else {
					topics.addNode(this);
				}

				break;
		}
	},

	// загрузить тему
	loadPosts:function () {

		//console.log('loadPosts:', this.data.topic_name, this.data.id);

		t.funcs.unloadTopic();
		this.select(); // делаем тему в столбце тем активной
		t.sync.curTopic = this.id;
		if (t.user.hasRight('editMessage', t.topics[this.id])) t.units.posts.header.topicRename.show();

		t.units.posts.unscribe();
		t.units.posts.subscribe(this.id, t.cfg.posts_per_page)

		t.units.posts.startWaitIndication();
	},

	select:function () {
		this.deselect();
		this.$body.addClass('active');
	},

	deselect:function () {
		t.funcs.topicDeselect();
	},

	isSelected:function(){
		return this.$body.hasClass('active');
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
		delete(t.topics[this.id]);
	},

	forceRead:function(){
		var now = new Date();

		t.stateService.push({
			action:'read_topic',
			id: this.data.id,
			time: now.getTime()
		});

		t.stateService.flushState();

		this.markRead();
	}
});




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
			'forceUnread'
		])

		t.protos
			.Node.prototype
			.construct.call(this, data, 'post',
			[
				'avatar',
				'avatar_box',
				'tags_edit'
			]
		);

		this.select = $.proxy(this, 'select');
		this.kill = $.proxy(this, 'kill');

		this.$body.click(this.select);
		//this.cells.$message.on('click', this.select);

		/* Панель действий */

		// todo - каждую кнопку формировать и навешивать на нее действие отдельно, в зависимости от прав

		this.mainPanel = new t.protos.ui.Panel([
			{type:'Button', label:'edit', icon:'doc_edit.png', text:t.txt.edit},
			{type:'Button', label:'delete', icon:'doc_delete.png', text:t.txt['delete']},
			{type:'Button', label:'unlock', icon:'padlock_open.png', text:t.txt.unblock},
			{type:'Button', label:'mark_unread', icon:'message_unread.png', text: t.txt.mark_next_unread}
		]);

		this.cells.$controls.append(this.mainPanel.$body);

		this.mainPanel.unlock.$body.hide();

		this.mainPanel.edit.on('click', this.edit);
		this.mainPanel.edit.on('click', this.hideMenu);
		//this.cells.$message.on('dblclick', this.edit);
		//this.mainPanel.edit.on('click', t.funcs.stopProp);
		this.mainPanel['delete'].on('click', this.erase);
		//this.mainPanel['delete'].on('click', t.funcs.stopProp);
		this.mainPanel.unlock.on('click', this.unlock);
		this.mainPanel.mark_unread.on('click', this.forceUnread);


		// права (todo - сделать наоборот!)
		if (!t.user.hasRight('editMessage', this)) this.mainPanel.edit.$body.remove();
		if (!t.user.hasRight('deleteMessage', this)) this.mainPanel['delete'].$body.remove();
		if (!t.user.hasRight('admin', this)) this.mainPanel.unlock.$body.remove();
		// todo - тема, вручную отмеченная непрочитанной не отмечается таковой в списке тем, если последний пост в ней - текущего юзера
		if (!t.user.hasRight('readMessage', this)) this.mainPanel.mark_unread.$body.remove();

		/* панель редактирования */

		this.editorPanel = new t.protos.ui.Panel([
			{type:'Button', label:'cancel', cssClass:'right', icon:'cancel.png', text:t.txt.cancel},
			{type:'Button', label:'save', cssClass:'right', icon:'round_checkmark.png', text:t.txt.save}
		]);

		this.editorPanel.$body.hide();
		if (t.user.hasRight('editMessage', this)) this.cells.$controls2.append(this.editorPanel.$body);

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
	},

	// заполнить сообщение данными
	fill:function (data) {
		t.protos
			.Node.prototype
			.fill.apply(this, arguments);

		this.cells.$avatar.attr('src', data.author_avatar);
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
		delete(t.posts[this.id]); //todo - проверить, удаляется ли сам элемент массива
	},

	// прокручивает список до данного сообщения
	show:function (start) {

		//console.log('post show:', this.data.id);

		t.protos.Node.prototype
			.show.apply(this, arguments);

		var thisLast = this.$body.next().size() == 0;

		if (start == false) {
			var $postsU = t.units.posts;
			if (!thisLast)
				$postsU.$scrollArea.scrollTop($postsU.$scrollArea.scrollTop() + parseInt($postsU.$contentWrap.css('padding-bottom')));
			else
				$postsU.scrollToBottom();
		}
	},

	// начинает редактирование с проверки блокировки
	edit:function () {

		JsHttpRequest.query('backend/service.php', { // аргументы:
			action:'check_n_lock',
			id:this.id
		}, this.enterEditMode, true);

		return false; // preventDefault + stopPropagation
	},

	// демонстрирует блокировку, или входит в режим редактирования
	enterEditMode:function (result, errors) {
		var that = this;

		if (result.locked !== null) {

			if (t.state.userID == '1') {
				if (confirm(t.txt.post_locked + '\n' + t.txt.post_locked_admin)) {
					this.unlock()
				} else {
					this.mainPanel.unlock.$body.show();
				}
			} else alert(t.txt.post_locked);

		} else {

			this.messageBackup = this.cells.$message.html();

			this.hideMenu();
			this.cells.$menuBtn.hide();

			if (this.data.head) {
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

			this.cells.$message.attr('contenteditable', true);
			this.cells.$message.focus();
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
		this.cells.$message.removeAttr('contenteditable');
	},

	// срабатывает при нажатии кнопки "сохранить" в режиме редактирования
	save:function () {

		console.log('write tags:', this.data.newTags)

		t.connection.write({
			action: 'update_message',
			id:this.id,
			message:this.cells.$message.html(),
			tags:this.data.newTags
		});
		this.exitEditMode();

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
		JsHttpRequest.query('backend/service.php', { // аргументы:
			action:'unlock_message',
			id:this.id
		}, function () {
		}, true);

		this.mainPanel.unlock.$body.hide();

		return false; // preventDefault + stopPropagation
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
				time: latestReadTS
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
