/**
 * Created by M. Yegorov on 1/23/14.
 */

t.protos.UserWatcher = function () {
	t.funcs.bind(this);

	this.stylesheet = $('<style class="userWatcher">').appendTo($('head'));
	this.usersToWatch = ["1"];
	this.localList = [];

	t.connection.subscribe(this, 'online_users', {
		feed:'users',
		fields:['online'], // пока не работает
		ids:this.usersToWatch.join(',')
	})

}

t.protos.UserWatcher.prototype = {
	forceToOnline:function(userId){
		if (this.localList.indexOf(userId) == -1) {
			this.localList.push(userId);

			this.rewriteRule();
		}
	},

	rewriteRule:function(newList){

		if (typeof newList != 'undefined') {
			this.localList = newList;
		}

		var selectors = this.localList.map(function(val){ return '.user-'+ val +' .isOnline' });
		var rule = selectors.join(',\n') + '{display:block}';

		this.stylesheet.text(rule);

		console.log('rewriting online rule');
	},

	parseFeed: function(users){
		users = users.online_users;

		//console.log('online users from server:', users);
		//console.log('online users memorized:', this.localList);

		var changes = false;

		for (var i = 0; i < users.length; i++) {
			// если присланного юзера нет в локальном списке
			if (this.localList.indexOf(users[i]) == -1) {
				changes = true;
				break;
			}
		}

		for (var i = 0; i < this.localList.length; i++) {
			// если в локальном списке есть юзер, которого нет в присланном
			if (users.indexOf(this.localList[i]) == -1) {
				changes = true;
				break;
			}
		}

		if (changes) {
			this.rewriteRule(users);
		}
	}
}
