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
			'controls'

		].concat(addCells || []);

		this.cells = {};
		for (var i in cells) this.cells['$' + cells[i]] = this.$body.find('[data-cell="' + cells[i] + '"]');

		// заполняем неизменные данные, присваеваемые единожды
		this.$body.attr('id', chunkName + '_' + data.id);
		this.$body.attr('data-number', data.id);
		this.cells.$message.addClass('message_' + data.id);
		this.cells.$id.text(data.id);
	},

	// заполнить данными
	fill:function (data) {

		this.data = data;

		// общие поля
		this.cells.$message.html(data.message);
		this.cells.$created.text(data.modified ? t.txt.modified + data.modified : data.created);
		this.cells.$author.text(data.author);
	},

	show:function (start) {
		this.$body[0].scrollIntoView(start);
	}
});




tinng.protos.TopicNode = Class(tinng.protos.Node, {

	construct:function (data) {

		t.protos
			.Node.prototype
			.construct.call(this, data, 'topic',
			[
				'tags',
				'lastmessage',
				'topicname',
				'postsquant'
			]
		);

		// проксирование функций
		this.loadPosts = $.proxy(this, 'loadPosts');
        this.kill = $.proxy(this, 'kill');

		// вешаем обработчики событий
		this.$body.on('click', this.loadPosts);
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
				'<div>' + t.txt.lastpost + '<b>' + data.lastauthor + '</b> (' + data.lastdate + ') ' + data.lastpost + '</div>'
			);
		}

		// вбиваем теги
		//todo: сейчас теги при каждом филле обнуляются и вбиваются заново. непорядок
		if (data.tags) {
			this.cells.$tags.text('');
			for (var i in data.tags) {
				this.cells.$tags.append(new t.protos.Tag(data.tags[i]).$body);
			}
		}
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

//        console.log('loadPosts:', this.data.topic_name, this.data.id);

		t.funcs.unloadTopic();
		this.select(); // делаем тему в столбце тем активной
		t.sync.curTopic = this.id;
		if (t.user.hasRight('editMessage', t.topics[this.id])) t.units.posts.header.topicRename.show();
		t.address.set({topic:this.id, plimit:t.sync.plimit});
        t.rotor.start('load_pages');

		t.units.posts.startWaitIndication();
	},

	select:function () {
		this.deselect();
		this.$body.addClass('active');
	},

	deselect:function () {
		t.funcs.topicDeselect();
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

	//todo - при данной реализации с ноды слетают все события! использование функции отключено
	detach:function () {
		this.$body.remove();
	}
});




tinng.protos.PostNode = Class(tinng.protos.Node, {

	construct:function (data) {

		t.protos
			.Node.prototype
			.construct.call(this, data, 'post',
			[
				'avatar',
				'controls'
			]
		);

		this.select = $.proxy(this, 'select');
		this.kill = $.proxy(this, 'kill');

		this.$body.click(this.select);
		//this.cells.$message.on('click', this.select);

		/* Панель действий */

		// todo - каждую кнопку формировать и навешивать на нее действие отдельно, в зависимости от прав

		this.mainPanel = new t.protos.ui.Panel([
			{type:'Button', label:'delete', cssClass:'right', icon:'doc_delete.png', tip:t.txt['delete']},
			{type:'Button', label:'edit', cssClass:'right', icon:'doc_edit.png', tip:t.txt.edit},
			{type:'Button', label:'unlock', cssClass:'right', icon:'padlock_open.png', text:t.txt.unblock}
		]);

		this.mainPanel.unlock.$body.hide();
		if (t.user.hasRight('editMessage', this)) this.cells.$controls.append(this.mainPanel.$body);

		this.edit = $.proxy(this, 'edit');
		this.enterEditMode = $.proxy(this, 'enterEditMode');
		this.erase = $.proxy(this, 'erase');
		this.unlock = $.proxy(this, 'unlock');

		this.mainPanel.edit.on('click', this.edit);
		//this.cells.$message.on('dblclick', this.edit);
		//this.mainPanel.edit.on('click', t.funcs.stopProp);
		this.mainPanel['delete'].on('click', this.erase);
		//this.mainPanel['delete'].on('click', t.funcs.stopProp);
		this.mainPanel.unlock.on('click', this.unlock);

		/* панель редактирования */

		this.editorPanel = new t.protos.ui.Panel([
			{type:'Button', label:'cancel', cssClass:'right', icon:'cancel.png', text:t.txt.cancel},
			{type:'Button', label:'save', cssClass:'right', icon:'round_checkmark.png', text:t.txt.save}
		]);

		this.editorPanel.$body.hide();
		if (t.user.hasRight('editMessage', this)) this.cells.$controls.append(this.editorPanel.$body);

		this.save = $.proxy(this, 'save');
		this.cancelEdit = $.proxy(this, 'cancelEdit');

		this.editorPanel.save.on('click', this.save);
		this.editorPanel.cancel.on('click', this.cancelEdit);
	},

	// заполнить сообщение данными
	fill:function (data) {
		t.protos
			.Node.prototype
			.fill.apply(this, arguments);

		this.cells.$avatar.attr('src', data.avatar_url);
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

		t.protos
			.Node.prototype
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

			this.mainPanel.$body.hide();
			this.editorPanel.$body.show();

			this.cells.$message.attr('contenteditable', true);
			this.cells.$message.focus();
		}
	},

	// срабатывает при отмене редактирования
	cancelEdit:function () {

		this.exitEditMode();

		this.unlock();
		this.cells.$message.html(this.messageBackup);
		this.messageBackup = '';

		return false; // preventDefault + stopPropagation
	},

	// выходит из режима редактирования
	exitEditMode:function () {
		this.editorPanel.$body.hide();
		this.mainPanel.$body.show();
		this.cells.$message.removeAttr('contenteditable');
	},

	// срабатывает при нажатии кнопки "сохранить" в режиме редактирования
	save:function () {

		t.rotor.start('update_message', {
			id:this.id,
			message:this.cells.$message.html()
		});
		this.exitEditMode();

		return false; // preventDefault + stopPropagation
	},

	// срабатывает при нажатии кнопки "удалить" в режиме редактировая
	erase:function () {

		if (confirm(t.txt.msg_del_confirm)) {
			t.rotor.start('delete_message', {id:this.id});
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
	}
});
