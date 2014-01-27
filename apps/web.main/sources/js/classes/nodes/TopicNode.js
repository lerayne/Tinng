/**
 * Created by M. Yegorov on 1/27/14.
 */

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
