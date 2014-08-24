/**
 * Created by Michael on 24.08.14.
 */

tinng.protos.UserUnit = Class(tinng.protos.MobileUnit, {
	inherit:function(funcName, args){
		t.protos.MobileUnit.prototype[funcName].apply(this, args);
	},

	construct:function(){
		this.inherit('construct', arguments);

		this.$avatar = $('<img src="' + t.user.data.avatar + '">');

		//panel
		this.header = new t.protos.ui.Panel([
			{type:'Button', label:'backBtn', cssClass:'left', text:'Back'},
			{type:'Field', label:'avatar', cssClass:'avatar right', html:this.$avatar},
			{type:'Field', label:'displayName', cssClass:'display-name right', text: t.user.data.displayName || t.user.data.login}
		])

		this.ui.$header.append(this.header.$body);

		this.header.backBtn.on('click', function(){ t.ui.activateUnit('topics') })

		//user info page
		this.userInfo = t.chunks.get('user-info');
		this.loginPage = t.chunks.get('login-page')
		this.registrationPage = t.chunks.get('registration-page')
		this.passwordPage = t.chunks.get('password-page')
	},

	activate:function(){
		this.inherit('activate', arguments);

		this.addNode(this.userInfo);
		this.addNode(this.loginPage);
		this.addNode(this.registrationPage);
		this.addNode(this.passwordPage);

		this.ui.$content.find('.unit-page').hide();

		if (t.user.id > 0) {
			this.userInfo.$body.show();
		} else {
			this.loginPage.$body.show();
		}
	}
})
