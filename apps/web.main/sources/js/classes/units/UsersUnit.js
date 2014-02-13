/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include _Unit.js
 */

//todo - класс и особоенно парсинг сделан на скорую руку - переделать! Как минимум не учитывается сортировка при обновлении
tinng.protos.UsersUnit = Class(tinng.protos.Unit, {

	construct: function () {
		t.protos.Unit.prototype
			.construct.apply(this, arguments);

		this.header = new t.protos.ui.Panel([
			{type:'Field', label:'title', cssClass:'title'}
		]);

		this.$flags = $('<div class="flags">').appendTo(this.$body);

		this.unreadFlag = new t.protos.Chunk('' +
			'<div class="flag">' +
			'	<div data-cell="text" class="text"></div>' +
			'</div>'
			, 'data-cell'
		);

		this.unreadFlag.appendTo(this.$flags);

		this.header.title.$body.text(t.txt.title_all_users);
		this.ui.$header.append(this.header.$body);
	},

	nullify:function(){
		t.protos.Unit.prototype
			.nullify.apply(this, arguments);

		this.unread = {};
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

		this.unread = {}

		if (quantity > 0) {

			this.unreadFlag.$body.show();
			this.unreadFlag.$text.text('+'+quantity);

			for (var i = 0; i < dialogues.length; i++) {
				var dialogue = dialogues[i];

				if (!this.unread[dialogue.sender]) this.unread[dialogue.sender] = 0;
				this.unread[dialogue.sender]++ ;
			}

			this.appendMarkers();

		} else {
			this.unreadFlag.$body.hide();
		}
	},

	appendMarkers:function(){
		console.log('this.unread', this.unread);

		for (var userId in this.unread) {

			if (this.usersList[userId] && !this.usersList[userId].$appends.children().size()) {
				this.appendUnreadMarker(userId, this.unread[userId])
			}
		}
	},

	appendUnreadMarker:function(userId, q){
		var user = this.usersList[userId];

		if (!user.$appends.children().size()) {
			$('<div class="unreadLabel">').text('+'+q).appendTo(user.$appends);
		}
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
