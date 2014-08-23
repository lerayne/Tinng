/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include ./sources/js/classes/common/units/_Unit.js
 */

tinng.protos.DesktopUnit = Class(tinng.protos.Unit, {

	construct: function () {
		t.protos.Unit.prototype.construct.apply(this, arguments)

		var that = this;

		t.funcs.bind(this, [
			'onScroll'
		])

		/* ОБРАБОТКА */

		if (this.data.minimizeButton) this.data.minimizeButton.click(this.toggleActive);

		// привязка событий прокрутки
		this.ui.$scrollArea.on('scroll', this.onScroll);
		this.ui.$scrollArea.scroll();

		// выпадающее меню
		this.ui.$body.addClass('with-settings');
		this.settingsBtn = new t.protos.ui.Button(
			{label:'settingsBtn', cssClass:'right', icon:'gear_white.png', tip: t.txt.unit_settings}
		);
		this.settingsBtn.$body.appendTo(this.ui.$settingsBtn);
		this.settingsBtn.on('click', function(){
			that.settingsBtn.freeze();
			that.ui.$settingsDropdown.show();
		})
		this.ui.$settingsMenu.on('mouseleave', function(){
			that.settingsBtn.unfreeze();
			that.ui.$settingsDropdown.hide();
		})
	},

	nullify:function(){
		t.protos.Unit.prototype.nullify.apply(this, arguments)

		this.refreshMenu();
	},

	placeTo:function(){
		t.protos.Unit.prototype.placeTo.apply(this, arguments);

		this.activate();
	},

	refreshMenu:function(){
		if (!this.ui.$settingsDropdown.children().not('.none').size()) this.ui.$body.removeClass('with-settings');
		else this.ui.$body.addClass('with-settings');
	},

	setHeight: function (num) {
		var height = num - this.ui.$header.offsetHeight() - this.ui.$footer.offsetHeight();
		this.scrollAreaH = height;
		this.ui.$scrollArea.height(height);
	},

	onScroll: function () {
		this.scrolledBy = this.ui.$scrollArea.scrollTop();

		this.atBottom = this.scrollAreaH + this.scrolledBy - this.ui.$contentWrap.offsetHeight() >= 0;
		this.atTop = this.scrolledBy == 0;
	}
});
