/**
 * Created by Michael on 24.08.14.
 */

tinng.protos.ui.LoginControl = function(data){

	t.funcs.bind(this)

	this.$body = $('<div class="login-control"></div>');

	if (t.user.id > 0) {
		this.$button = $('<div class="avatar"><img src="'+ t.user.data.avatar +'"></div>').appendTo(this.$body);
		this.button = this.$button;
	} else {
		this.$button = new t.protos.ui.Button({text:t.txt.login_btn})
		this.$button.$body.appendTo(this.$body);
		this.button = this.$button.$body;
	}

	if (data.cssClass) this.button.addClass(data.cssClass);

	this.button.on('click', function(){
		t.ui.activateUnit('user');
	});
}

tinng.protos.ui.LoginControl.prototype = {

}
