/**
 * Created by M. Yegorov on 1/23/14.
 */

t.protos.UserWatcher = function () {
	t.funcs.bind(this);

	this.stylesheet = $('<style class="userWatcher">').appendTo($('head'));

	this.subscribers = [];
	this.watches = [];
	this.watchesUnique = [];
	this.localOnlineList = [];
}

t.protos.UserWatcher.prototype = {
	watch:function(subscriber, userId) {
		if (this.subscribers.indexOf(subscriber) == -1) {
			this.subscribers.push(subscriber);
			this.watches.push([]);
		}

		var subscriberId = this.subscribers.indexOf(subscriber);

		if (this.watches[subscriberId].indexOf(userId) == -1) this.watches[subscriberId].push(userId);

		this.subscribe();
	},

	unwatch:function(subscriber){
		var i = this.subscribers.indexOf(subscriber);

		if (i != -1) {
			this.subscribers.splice(i, 1);
			this.watches.splice(i, 1);
		}
	},

	subscribe:function(){
		this.watchesUnique = [];

		for (var i = 0; i < this.watches.length; i++) {
			var subscriber = this.watches[i];

			for (var j = 0; j < subscriber.length; j++) {
				var user = subscriber[j];

				if (this.watchesUnique.indexOf(user) == -1) this.watchesUnique.push(user);
			}
		}

		t.connection.softRescribe(this, 'online_users', {
			feed:'users',
			fielter:'online',
			fields:'id',
			ids:this.watchesUnique.join(',')
		})
	},

	forceToOnline:function(userId){
		if (this.localOnlineList.indexOf(userId) == -1) {
			this.localOnlineList.push(userId);

			this.rewriteRule();
		}
	},

	parseFeed: function(users){
		users = users.online_users;

		//console.log('online users from server:', users);
		//console.log('online users memorized:', this.localOnlineList);

		var changes = false;

		for (var i = 0; i < users.length; i++) {
			// если присланного юзера нет в локальном списке
			if (this.localOnlineList.indexOf(users[i]) == -1) {
				changes = true;
				break;
			}
		}

		for (var i = 0; i < this.localOnlineList.length; i++) {
			// если в локальном списке есть юзер, которого нет в присланном
			if (users.indexOf(this.localOnlineList[i]) == -1) {
				changes = true;
				break;
			}
		}

		if (changes) {
			this.rewriteRule(users);

			for (var i = 0; i < this.subscribers.length; i++) {
				var subscriber = this.subscribers[i];

				if (subscriber.parseOnlineStates) subscriber.parseOnlineStates(users)
			}
		}
	},

	rewriteRule:function(newList){

		if (typeof newList != 'undefined') {
			this.localOnlineList = newList;
		}

		var selectors = this.localOnlineList.map(function(val){ return '.user-'+ val +' .isOnline' });
		var rule = selectors.join(',\n') + '{display:block}';

		this.stylesheet.text(rule);

		//console.log('rewriting online rule');
	}
}
