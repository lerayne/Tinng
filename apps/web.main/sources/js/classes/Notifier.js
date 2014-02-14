/**
 * Created by Lerayne on 14.02.14.
 */

tinng.protos.Notifier = function(){
	t.funcs.bind(this, ['send']);
	var that = this;

	console.log('Notification.permission', Notification.permission);
	console.log('default', Notification.permission == 'default');

	if (Notification && Notification.permission == 'default' && t.user.id > 0) {
		var activationLink = $('.notification_perm_request');
		activationLink.css('display', 'block').click(function(){
			that.send(t.txt.notification_perm_granted)
			activationLink.hide();
		})
	}
}

tinng.protos.Notifier.prototype = {
	send:function(title){
		var that = this;

		if (Notification) {
			if (Notification.permission == 'default') {
				Notification.requestPermission(function(level){
					Notification.permission = level;
					if (level == 'granted') {
						that.createNotification(title)
					}
				})
			}

			if (Notification.permission == 'granted'){
				this.createNotification(title)
			}
		}
	},

	createNotification:function(message) {
		var message = new Notification(message);
	}
}
