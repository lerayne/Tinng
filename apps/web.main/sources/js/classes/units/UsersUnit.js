/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include _Unit.js
 */

//todo - класс и особоенно парсинг сделан на скорую руку - переделать! Как минимум не учитывается сортировка при обновлении
tinng.protos.UsersUnit = Class(tinng.protos.Unit, {

	construct: function () {
		t.funcs.bind(this, ['markRead']);

		t.protos.Unit.prototype
			.construct.apply(this, arguments);

		this.header = new t.protos.ui.Panel([
			{type:'Field', label:'title', cssClass:'title'}
		]);

		this.$flags = $('<div class="flags">').appendTo(this.$body);

		this.unreadFlag = new t.protos.Chunk('' +
			'<div class="flag messages none">' +
			'	<div data-cell="text" class="text"></div>' +
			'</div>'
			, 'data-cell'
		);

		this.unreadFlag.appendTo(this.$flags);

		this.header.title.$body.text(t.txt.title_all_users);
		this.ui.$header.append(this.header.$body);

		$(document).on('read_topic', this.markRead)
	},

	nullify:function(){
		t.protos.Unit.prototype
			.nullify.apply(this, arguments);

		this.unread = {};
		this.unreadQuant = 0;
		this.usersList = {};
		this.currentOnlineList = [];

		this.$onlineList = t.chunks.get('onlineList').$body;
		this.$offlineList = t.chunks.get('offlineList').$body;

		this.ui.$content.append(this.$onlineList);
		this.ui.$content.append(this.$offlineList);
	},

	activate:function(){
		t.protos.Unit.prototype
			.activate.apply(this, arguments);

		var subscriptions = [];

		subscriptions.push({
			subscriber: this,
			feedName:'userlist',
			feed: {
				feed:'users',
				fields:[
					'id',
					'login',
					'display_name',
					'last_read',
					'last_read_ts',
					'avatar'
				]
			}
		});

		subscriptions.push({
			subscriber:this,
			feedName:'dialogues',
			feed:{
				feed:'dialogues',
				method:'updates_extended'
			}
		})

		t.connection.subscribe(subscriptions);
	},

	parseFeed:function(data){
		if (data.userlist) this.parseUserlist(data.userlist);
		if (data.dialogues) this.parseDialogues(data.dialogues);
	},

	parseUserlist:function(userlist){
		var now = new Date();

		for (var i = 0; i < userlist.length; i++) {
			var user = userlist[i];

			if (!this.usersList[user.id]){
				var userElement = this.usersList[user.id] = this.createUserElement(user);

				if (now.getTime() - user.last_read_ts * 1000 < t.cfg.online_threshold * 1000) {
					this.$onlineList.append(userElement.$body);
					this.currentOnlineList.push(user.id)
				} else {
					this.$offlineList.append(userElement.$body);
				}

				t.userWatcher.watch(this, user.id);
			}
		}

		this.appendMarkers();
	},

	parseDialogues:function(dialogues){
		var quantity = dialogues.length;

		if (quantity > 0) {

			for (var i = 0; i < dialogues.length; i++) {
				var message = dialogues[i];

				if (!this.unread[message.sender]) this.unread[message.sender] = {};
				this.unread[message.sender][message.id] = message.created;
			}

			this.unreadQuant += quantity;
			this.renderUnreadSum();
			this.appendMarkers();

			//console.log('dialogues', dialogues, this.unread, this.unreadQuant)
		}
	},

	appendMarkers:function(){

		for (var userId in this.unread) {
			if (this.usersList[userId]) this.renderReadState(userId);
		}
	},

	renderReadState:function(authorId){
		var quant = this.unread[authorId] ? t.funcs.objectSize(this.unread[authorId]) : 0;

		if (quant > 0) {
			this.usersList[authorId].$unread.text('+'+quant);
			this.usersList[authorId].$unread.show();
		} else {
			this.usersList[authorId].$unread.hide();
		}
	},

	renderUnreadSum:function(){
		if (this.unreadQuant > 0) {
			this.unreadFlag.$body.removeClass('none');
			this.unreadFlag.$text.text('+'+ this.unreadQuant);
		} else {
			this.unreadFlag.$body.addClass('none');
		}
	},

	markRead:function(e){
		var params = e.message;

		if (params.author && params.dialogue != 0 && this.unread[params.author]) {
			for (var msg_id in this.unread[params.author]){
				if (this.unread[params.author][msg_id] <= params.time) {
					delete this.unread[params.author][msg_id];
					this.unreadQuant--;
				}
			}

			if (!t.funcs.objectSize(this.unread[params.author])) delete this.unread[params.author];

			this.renderReadState(params.author);
			this.renderUnreadSum();
		}

		console.log('UsersUnit caught an event:', params);
	},

	createUserElement:function(data){
		var listItem = t.chunks.get('userListItem');
		var that = this;

		listItem.$body.addClass('userListItem user-'+data.id).attr('data-user', data.id);
		listItem.$name.text(data.display_name);
		listItem.$avatar.prop('src', data.avatar);

		listItem.$body.draggable({
			helper:"clone",
			appendTo:"#tinng-main-content",
			distance:5,
			scroll:false
		});

		if (data.id != t.user.id) {
			listItem.$body.click(function(){
				that.loadDialogue(data.id);
			});
		}


		return listItem;
	},

	parseOnlineStates:function(userlist) {

		if (userlist.indexOf(null) != -1) console.warn('warning! null present in [userlist]')

		try {
			for (var i = 0; i < userlist.length; i++) {
				var user = userlist[i];

				if (this.currentOnlineList.indexOf(user) == -1) {
					this.usersList[user].$body.appendTo(this.$onlineList)
				}
			}

			for (var i = 0; i < this.currentOnlineList.length; i++) {
				var user = this.currentOnlineList[i];

				if (userlist.indexOf(user) == -1) {
					this.usersList[user].$body.appendTo(this.$offlineList)
				}
			}
		} catch (e) {
			console.warn('Tinng: Ошибка парсинга онлайн-статусов:', e)
			console.log('user: ',user)
			console.log('userlist: ',userlist)
			console.log('currentOnlineList: ',this.currentOnlineList)
			console.log('this.usersList: ',this.usersList);
		}

		this.currentOnlineList = userlist;
	},

	loadDialogue:function(id){

		if (t.user.id && t.user.id != id) {
			t.units.posts.subscribe(id, t.cfg.posts_per_page, 'dialogue')
			t.units.posts.startWaitIndication();
		}
	}

})
