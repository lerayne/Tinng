/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 4:27 PM
 * To change this template use File | Settings | File Templates.
 */

// класс занимающийся интерфейсом
tinng.protos.UserInterface = function (targetWindow) {
	var that = this;

	// проксирование методов
	t.funcs.bind(this, ['winResize', 'editorResize', 'hideDialogue', 'showRegForm', 'hideMessage', 'showLoginForm', 'showRestoreForm', 'authVK']);

	/// СБОР ///

	// ссылки на важные эелементы
	this.window = targetWindow;
	this.$window = $(targetWindow);

	this.$mainFrame = $('#tinng-main');
	this.$unitsArea = $('#tinng-units-area');
	this.$sidePanels = $('#tinng-main-content .unit-panel');
	this.$mainHeader = $('#tinng-main-header');
	this.$mainFooter = $('#tinng-main-footer');
	this.$screenBg = $('#scaled-bg');

	this.$dialogueWrapper = $('#dialogue-wrapper');
	this.$dialogueClose = this.$dialogueWrapper.find('.close');
	this.$dialogueContent = this.$dialogueWrapper.find('section');
	this.$dialogueTitle = this.$dialogueWrapper.find('.title');
	this.$messageBar = $('#message-bar');

	this.$dialogueClose.click(this.hideDialogue);
	this.$messageBar.click(this.hideMessage);

	// коллекция размеров
	this.sizes = {};


	/// ОБРАБОТКА ///

	// управление верхним меню
	this.$loginForm = $('#tinng-top-login');

	if (this.$loginForm.size()){
		this.$loginBtn = this.$loginForm.find('#loginBtn').click(this.showLoginForm);
		this.$logoutBtn = this.$loginForm.find('#logoutBtn').click(function(){
			that.$loginForm[0].lochash.value = location.hash;
			that.$loginForm.submit();
		});
		this.$regBtn = this.$loginForm.find('#regBtn').click(this.showRegForm);
	}


	//управление боковыми панелями
	this.$sidePanels.each(this.createSidePanel);

	// создание юнитов
	t.units.topics = new t.protos.TopicsUnit({
		name:'topics',
		css:{width:'40%'}
	});
	t.units.posts = new t.protos.PostsUnit({
		name:'posts',
		css:{width:'60%'}
	});
	t.units.navigation = new t.protos.NavUnit({
		name:'navigation'
	});
	t.units.users = new t.protos.UsersUnit({
		name:'users'
	});

	// размещение юнитов
	t.units.topics.placeTo(this.$unitsArea);
	t.units.posts.placeTo(this.$unitsArea);
	t.units.navigation.placeTo(this.$sidePanels.eq(0).find('.unit-portal'));
	t.units.users.placeTo(this.$sidePanels.eq(1).find('.unit-portal'));

	this.$unitsArea.append(t.chunks.get('clearfix').$body);


	// редактор
	this.editor = new t.protos.Editor(t.units.posts.ui.$scrollArea);
	//this.editor.$body.on('keyup', this.editorResize);
	//t.units.posts.ui.$scrollArea.append(this.editor.$body);

	this.editor.hide();

	// вешаем событие на ресайз окна
	this.$window.resize(this.winResize).resize();
	t.units.posts.header.topicName.$body.on('keyup', this.winResize);


	// сообщения
	var serverMessage = t.funcs.getCookie('message');
	if (serverMessage) {
		this.showMessage(serverMessage);
		t.funcs.deleteCookie('message');
	}

	//скрытие некоторых элементов по клику на body
	$('body').click(function(){
		$('.bodyclickhide').hide();
	})
};

tinng.protos.UserInterface.prototype = {


	// изменяет высоту окна
	winResize:function () {

		var frameH = this.window.document.documentElement.clientHeight;
		var frameW = this.window.document.documentElement.clientWidth;

		// размер фоновой картинки
		if (frameH > frameW/1.6) {
			this.$screenBg.width('auto');
			this.$screenBg.height(frameH);
		} else {
			this.$screenBg.width(frameW);
			this.$screenBg.height('auto');
		}

		// подстройка отступов под разрешение
		this.$mainFrame.removeAttr('class');
		if (frameH < 800) this.$mainFrame.addClass('low-res');
		if (frameW < 1500) this.$mainFrame.addClass('low-width');
		if (frameH > 950) this.$mainFrame.addClass('high-res');


		// высота основного интерфейса
		var mainH = this.sizes.mainH = frameH - this.$mainHeader.offsetHeight() - this.$mainFooter.offsetHeight();

		for (var key in t.units) t.units[key].setHeight(mainH);

		this.editor.resize();
	},

	createSidePanel:function(){
		var panel = $(this);
		var label = panel.find('.label');
		var toggles = panel.find('.label, .close, .open');
		var text = label.find('.text');
		var side = panel.hasClass('panel-left') ? 'left' : 'right';
		var width = panel.width();

		panel.addClass('closed').css(side, 0 - width);
		var textOffset = (text.width()-label.width())/2;
		text.css(side, 0 - textOffset);

		toggles.click(function(){
			var params = {};
			params[side] = panel.hasClass('closed') ? 0 : 0 - width;

			panel.animate(params, 300, function(){
				panel.toggleClass('closed');
			});
		});
	},

	// Подгоняет внешний вид редактора под окно
//	editorResize:function () {
//		var posts = t.units.posts;
//		this.editor.$body.width(posts.ui.$content.width());
//
//		var atBottom = posts.atBottom; // не убирать! строка ниже меняет значение этого вызова!
//		posts.ui.$contentWrap.css('padding-bottom', this.editor.$body.offsetHeight());
//		if (atBottom) posts.scrollToBottom();
//		 // возможно в будущем для еще большей плавности стоит изменять целую пачку стилей с тем чтобы у поля ввода позиция
//		 // не всегда была fixed. Для этого придется повесить событие OnScroll и отследивать степень прокрутки. Возможно - тогда
//		 // не придется и плясать с нижним паддингом и враппер получится убрать
//	},

	showDialogue:function(title, content){

		this.$dialogueTitle.text(title);
		this.$dialogueContent.children().remove();
		this.$dialogueContent.append(content);
		this.$dialogueWrapper.show();
	},

	hideDialogue:function(){
		this.$dialogueWrapper.hide();
		this.$dialogueContent.children().remove();
	},

	showMessage:function(messageCode){
		// todo - оформить внешний вид сообщений, поработать с анимацией
		var body = this.$messageBar.find('.text');

		var message = txt['ret_message_'+messageCode] ? txt['ret_message_'+messageCode] : messageCode;

		body.html(message);
		this.$messageBar.slideDown();
		setTimeout(this.hideMessage, 10000);
	},

	hideMessage:function(){
		this.$messageBar.slideUp();
	},

	showLoginForm:function(){
		var template = t.chunks.get('login-form');
		var form = template.$form;

		template.$loginBtn.click(function(){
			template.$form[0].lochash.value = location.hash;
			template.$form.submit();
		});

		template.$forgetLink.click(this.showRestoreForm)

		this.showDialogue(txt['title_login'], template.$body);
	},

	showRestoreForm:function(){
		var template = t.chunks.get('pass-restore-form');

		this.showDialogue(txt['title_restore'], template.$body);
	},

	showRegForm:function(){
		var template = t.chunks.get('registration-form');

		var vldtr = new t.protos.Validator({
			form:template.$form,
			filters:{
				login: {regexp:t.rex.login, errtext:'Имя пользователя слишком корокое, слишком длинное, или содержит недопустимые символы'},
				pass: {regexp:t.rex.pass, errtext:'Пароль слишком корокий, слишком длинный, или содержит недопустимые символы'},
				email: {regexp:t.rex.email, errtext:'Неверный формат e-mail'}
			}
		});

		var validate = function(input, name){
			console.log('validate_'+name+':');

			var data = {};
			data['action'] = 'check_'+name;
			data[name] = input.val();

			$.post(appPath + 'login.php', data, function(data){

				if (data == 'allowed') vldtr.addToValid(input);
				else vldtr.invalid(input, txt['ajax_error_'+name]);

			});
		}

		vldtr.customFuncs = {

			validateLogin:function(input){
				validate(input, 'login');
			},

			validateEmail:function(input){
				validate(input, 'email')
			}
		}

		this.showDialogue(txt['title_register'], template.$body);
	}
};
