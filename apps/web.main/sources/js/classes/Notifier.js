/**
 * Created by Lerayne on 14.02.14.
 */

tinng.protos.Notifier = function(){
	t.funcs.bind(this, ['send']);
	var that = this;

	if (Notification && Notification.permission == 'default' && t.user.id > 0) {
		var activationLink = $('.notification_perm_request');
		activationLink.css('display', 'block').click(function(){
			that.send(t.txt.notification_perm_granted)
			activationLink.hide();
		})
	}
}

tinng.protos.Notifier.prototype = {
	send:function(title, message, icon, tag, click){
		var that = this;

		if (Notification) {
			if (Notification.permission == 'default') {
				Notification.requestPermission(function(level){
					Notification.permission = level;
					if (level == 'granted') {
						that.createNotification(title, message, icon, tag, click)
					}
				})
			}

			if (Notification.permission == 'granted'){
				this.createNotification(title, message, icon, tag, click)
			}
		}
	},

	createNotification:function(title, message, icon, tag, click) {
		var message = new Notification(title, {
			body:message,
			icon:icon
			//,tag:tag
		});

		// todo - обходной маневр для хрома, который не показывает сообщение с тегом
		message.ondisplay = function(){
			return tag;
		};

		if (typeof click != 'undefined'){
			message.onclick = click;
		}
	}
}
