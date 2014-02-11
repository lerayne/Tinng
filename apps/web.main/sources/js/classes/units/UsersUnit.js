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

		this.header.title.$body.text(t.txt.title_all_users);
		this.ui.$header.append(this.header.$body);
	},

	nullify:function(){
		t.protos.Unit.prototype
			.nullify.apply(this, arguments);

		this.objectsList = {};
		this.currentOnlineList = [];

		this.$onlineList = t.chunks.get('onlineList').$body;
		this.$offlineList = t.chunks.get('offlineList').$body;

		this.ui.$content.append(this.$onlineList);
		this.ui.$content.append(this.$offlineList);
	},

	activate:function(){
		t.protos.Unit.prototype
			.activate.apply(this, arguments);

		t.connection.subscribe(this, 'userlist', {
			feed:'users',
			fields:[
				'id',
				'login',
				'display_name',
				'last_read',
				'last_read_ts',
				'avatar'
			]
		});
	},

	parseFeed:function(data){
		if (data.userlist) this.parseUserlist(data.userlist);
	},

	parseUserlist:function(userlist){
		var now = new Date();

		for (var i = 0; i < userlist.length; i++) {
			var user = userlist[i];

			if (!this.objectsList[user.id]){
				this.objectsList[user.id] = this.createUserElement(user);

				if (now.getTime() - user.last_read_ts * 1000 < t.cfg.online_threshold * 1000) {
					this.$onlineList.append(this.objectsList[user.id]);
					this.currentOnlineList.push(user.id)
				} else {
					this.$offlineList.append(this.objectsList[user.id]);
				}

				t.userWatcher.watch(this, user.id);
			}
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


		return listItem.$body;
	},

	parseOnlineStates:function(userlist) {

		try {
			for (var i = 0; i < userlist.length; i++) {
				var user = userlist[i];

				if (this.currentOnlineList.indexOf(user) == -1) {
					this.objectsList[user].appendTo(this.$onlineList)
				}
			}

			for (var i = 0; i < this.currentOnlineList.length; i++) {
				var user = this.currentOnlineList[i];

				if (userlist.indexOf(user) == -1) {
					this.objectsList[user].appendTo(this.$offlineList)
				}
			}
		} catch (e) {
			console.warn('Tinng: Ошибка парсинга онлайн-статусов:', e)
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
