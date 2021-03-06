/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include _Node.js
 */

tinng.protos.TopicNode = Class(tinng.protos.Node, {

	construct:function (data) {
		var that = this;

		t.funcs.bind(this, [
			'loadPosts',
			'kill',
			'forceRead',
			'moveToThisTopic'
		])

		t.protos
			.Node.prototype
			.construct.call(this, data, 'topic');

		// вешаем обработчики событий
		this.$body.on('click', this.loadPosts);

		this.mainPanel = new t.protos.ui.Panel([
			{type:'Button', label:'mark_read', icon:'message_read.png', text: t.txt.mark_read}
		]);

		this.mainPanel.mark_read.$body.addClass('none');
		this.mainPanel.mark_read.on('click', this.forceRead);

		this.cells.$controls.append(this.mainPanel.$body);

		if (data.author_id == t.user.id || t.user.id == 1) {
			this.$body.droppable({
				accept:function(elem){
					if (!elem.hasClass('post')) return false;
					if (elem.attr('data-topic') == that.data.id) return false;
					return true;
				},
				activeClass:'acceptable',
				hoverClass:'ready',
				tolerance:'pointer',

				drop: this.moveToThisTopic
			})
		}
	},

	// заполнить данными
	fill:function (data) {

		t.protos
			.Node.prototype
			.fill.apply(this, arguments);

		//console.log('data', data);

		//this.cells.$postsquant.text(data.postsquant + t.txt.msgs);
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
		} else {
			this.markRead('noupd')
		}

		if (this.data.private == 1) {
			this.cells.$private.show();
		} else {
			this.cells.$private.hide();
		}

		this.updateMenu();
	},

	markRead:function(noupd){
		t.protos.Node.prototype
			.markRead.apply(this, arguments);

		this.mainPanel.mark_read.$body.addClass('none');

		if (noupd != 'undefined') this.updateMenu();
	},

	// изменить положение в списке при обновлении
	bump:function () {
		var topics = t.units.topics;

		switch (topics.state.sort) {

			// сортировка по последнему обновлению
			case 'updated':
				topics.addNode(this);
				break;
		}
	},

	// загрузить тему
	loadPosts:function () {

		t.sync.curTopic = this.id;

		t.units.posts.subscribe(this.id, t.cfg.posts_per_page);
		this.select(); // делаем тему в столбце тем активной

		//todo - это хак для мобильной версии. В будущем нужно сделать для каждой своё, или реализовать данную функцию полноценно
		if (t.ui.activateUnit) t.ui.activateUnit('posts')

		t.units.posts.startWaitIndication();
	},

	select:function () {
		this.deselect();
		this.$body.addClass('active');
	},

	deselect:function () {
		$('.topics .active').removeClass('active');
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
	},

	moveToThisTopic:function(e, ui){
		var that = this;

		if (confirm(t.txt.warn_move_next)){
			var postId = ui.draggable.attr('data-id');
			var timeFrom = t.posts[postId].data.created;
			var topicFrom = ui.draggable.attr('data-topic');
			var topicTo = this.data.id;

			console.log('Moving posts from topic '+topicFrom+' to topic '+topicTo+' starting from '+ t.posts[postId].data.created)

			t.connection.query('service', t.connection.refresh, {
				action: 'move_posts',
				topic_from: topicFrom,
				topic_to:topicTo,
				time_from:timeFrom
			});
		}
	}
});
