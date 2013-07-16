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
	t.funcs.bind(this, ['hideMessage', 'showLoginForm', 'showRestoreForm', 'authVK']);

	this.winResize = $.proxy(this, 'winResize');
	this.editorResize = $.proxy(this, 'editorResize');
	this.hideDialogue = $.proxy(this, 'hideDialogue');
	this.showRegForm = $.proxy(this, 'showRegForm');

	/// СБОР ///

	// ссылки на важные эелементы
	this.window = targetWindow;
	this.$window = $(targetWindow);

	this.$mainFrame = $('#tinng-main');
	this.$unitsArea = $('#tinng-units-area');
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

	// размещение юнитов

	t.units.topics = new t.protos.TopicsUnit(t.data.units[0]);
	t.units.posts = new t.protos.PostsUnit(t.data.units[1]);
	this.$unitsArea.append(
		t.units.topics.$body,
		t.units.posts.$body,
		t.chunks.get('clearfix')
	);


	this.editor = new t.protos.Editor();
	this.editor.$body.on('keyup', this.editorResize);
	t.units.posts.$scrollArea.append(this.editor.$body);

	// вешаем событие на ресайз окна
	this.$window.resize(this.winResize).resize();
	t.units.posts.header.topicName.$body.on('keyup', this.winResize);


	// сообщения
	var serverMessage = t.funcs.getCookie('message');
	if (serverMessage) {
		this.showMessage(serverMessage);
		t.funcs.deleteCookie('message');
	}
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
		if (frameH > 1000) this.$mainFrame.addClass('high-res');


		// высота основного интерфейса
		var mainH = this.sizes.mainH = frameH - this.$mainHeader.offsetHeight() - this.$mainFooter.offsetHeight();

		for (var key in t.units) t.units[key].setHeight(mainH);

		this.editor.resize();
	},

	// Подгоняет внешний вид редактора под окно
//	editorResize:function () {
//		var posts = t.units.posts;
//		this.editor.$body.width(posts.$content.width());
//
//		var atBottom = posts.atBottom; // не убирать! строка ниже меняет значение этого вызова!
//		posts.$contentWrap.css('padding-bottom', this.editor.$body.offsetHeight());
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
		var form = template.find('form');

		form.find('#doLogin').click(function(){
			form[0].lochash.value = location.hash;
			form.submit();
		});

		form.find('#passForget').click(this.showRestoreForm)

		this.showDialogue(txt['title_login'], template);
	},

	showRestoreForm:function(){
		var template = t.chunks.get('pass-restore-form');

		var vkAuth = template.find('#vkAuth');

		vkAuth.click(this.authVK);

		this.showDialogue(txt['title_restore'], template);
	},

	showRegForm:function(){
		var template = t.chunks.get('registration-form');
		var form = template.find('form');

		var vldtr = new t.protos.Validator({
			form:form,
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

		this.showDialogue(txt['title_register'], template);
	},

	authVK:function(){
		var template = t.chunks.get('auth-vk');

		this.showDialogue(txt['title_login'], template);
	}
};
