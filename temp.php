<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
	"http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title>UC alpha</title>
		
		<link id="favicon" rel="shortcut icon" type="image/png" href="skins/<?= $cfg['skin'] ?>/images/favicon.png">
		<meta content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" name="viewport" />
		
		<style type="text/css">
			
		</style>
		
		<script type="text/javascript" language="JavaScript">
			
			
			
			
			
			
			// Универсальный класс ветки
function NBranch (contArea, topicID, parentID) {
	if (!parentID) parentID = topicID;

	// чтобы this функций не забивал this объекта
	var branch = this;

	// указание на элемент, в который вставляется новый контейнер
	this.e = contArea;

	// создание контейнера для новой ветки
	this.cont = div(null, 'branch_'+parentID);
	this.e.appendChild(this.cont);

	// вставляет новый блок сообщения, заполняя его данными из content
	this.createBlock = function(row){
		var type = (topicID == '0') ? 'topic' : 'post';

		// редактирование полей записи через ajax. Аргументы подавать в виде:
		// (['field', containerObject], ['field', containerObject],...)
		var editFields = function (){

			var args = editFields.arguments;
			var jsonArgs = [];

			for (var i=0; i<args.length; i++){
				jsonArgs[i] = {};
				jsonArgs[i]['field'] = args[i][0];
				jsonArgs[i]['data'] = args[i][1].innerHTML;
				addClass(args[i][1], 'updating');
			}

			JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

				  action: 'update'
				, fields: jsonArgs
				, id: row['id']

			}, function(result, errors) { // когда пришел ответ:

				for (var j=0; j<args.length; j++){
					args[j][1].innerHTML = result[j][jsonArgs[j]['field']];
					created.innerHTML = txt['modified'] + result[j]['msg_modified'];
					removeClass(args[j][1], 'updating');

					maxPostDate = sql2stamp(result[j]['msg_modified']);

					if (errors) console('error: '+errors);
				}

			}, true /* запрещать кеширование */ );
		}

		// местная функция добавления кнопки с подсказкой
		var addBtn = function(name, caption){
			var btn = div('sbtn '+name, null, caption ? '<span>'+caption+'</span>' : null);
			controls.appendChild(btn);

			btn.onmouseover = function(){
				explain.innerHTML = txt['explain_'+name];
			}
			btn.onmouseout = function(){
				explain.innerHTML = '';
			}
			return btn;
		}

		// создаем элементы и применяем простые модификации
		var container	= div(type+' revealer', type+'_'+row['id']);
		var infobar		= div('infobar');
		var msgid		= div('msgid', null, '&nbsp;#'+row['id']+'&nbsp;')
		var created		= div('created reveal');
		var author		= div('author', null, txt['from']+row['author']);
		var message		= div('message', null, row['message']);
		var debug		= div();
		var controls	= div('controls reveal');
		var explain		= div('explain subtext');

		created.innerHTML = row['modified'] ? txt['modified'] + row['modified'] : row['created'];

		// действия в зависимости от типа блока
		switch (type){
		case 'topic':

			//debug.innerHTML = row['updated'];

			// вешаем на клик событие загрузки сообщений
			var clickload = function(){
				branches = {};
				fillPosts(row['id'], e('@contents', '#viewport_posts'));
				setCookie('currentTopic', row['id']);
				adress.set('topic', row['id']);
				adress.del('message');

				if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
				addClass(container, 'activetopic');
			}
			
			container.onclick = clickload;

			if (row['last']['message']){
				var lastpost = div('lastpost', 'lastpost_'+row['last']['id']);
				lastpost.innerHTML = txt['lastpost']+' <span class="author">'+row['last']['author']+'</span>';
				lastpost.innerHTML += ' ['+row['last']['created']+'] ';
				lastpost.innerHTML += row['last']['message'];
			}

			var postcount = div('postcount reveal', null, row['postcount'] + txt['postcount']);
			
			// создаем элемент "тема"
			var topic = div('topicname editabletopic revealer2');
			var topicname = div('left', null, row['topic'] ? row['topic'] : '&nbsp;');
			var topicedit_btn = div('sbtn btn_topicedit right reveal2');
			var topicsubmit_btn = div('sbtn btn_topicsubmit right none');
			var topiccancel_btn = div('sbtn btn_topiccancel right none');
			
			topicedit_btn.onmouseover = function(){
				container.onclick = null;
			}
			
			topicedit_btn.onmouseout = function(){
				if (!hasClass(topicname, 'edittopicname')) container.onclick = clickload;
			}
			
			appendKids(topic, topicname, topicedit_btn, topiccancel_btn, topicsubmit_btn, div('clearboth'));
			
			var cancelNameEdit = function(){
				hide(topicsubmit_btn, topiccancel_btn);
				unhide(topicedit_btn);
				topicname.contentEditable = false;
				removeClass(topicname, 'edittopicname');
				topicname.ondblclick = editTopicName;
				container.onclick = clickload;
			}
			
			// функция инлайн-редактирования темы
			var editTopicName = function(){
				hide(topicedit_btn);
				topicname.ondblclick = null;
				topicname.contentEditable = true;
				var text = topicname.innerHTML;
				topicname.focus();
				addClass(topicname, 'edittopicname');

				//!! дописать отмену и расположение кнопок
				var submitTopicName = function(){
					
					cancelNameEdit();

					// AJAX-запрос и заполнения поля
					editFields(['msg_topic', topicname]);
				}
				/*
				document.onkeypress = function(event){
					var key = event.keyCode || event.which;
					if (key == 13){
						submitTopicName();
						document.onkeypress = null;
					} // on enter
				}
				*/
				unhide(topicsubmit_btn, topiccancel_btn);
				
				topicsubmit_btn.onclick = submitTopicName;
				topiccancel_btn.onclick = cancelNameEdit;
			}

			// если имеем право переименовывать тему
			if (row['author_id'] == userID) {
				topicname.ondblclick = editTopicName;
				topicedit_btn.onclick = editTopicName;
			}

		break;
		case 'post':

			//debug.innerHTML += maxReadPost;

			if (maxReadPost && maxReadPost < sql2stamp(row['modified'] || row['created']))
				addClass(container, 'unread');

			// вешаем ID на контейнер сообщения для возможности прикрепления визивига
			message.id = 'message_'+row['id'];

			var avatar	= div('avatar', null, '<img src="'+row['avatar_url']+'">');

			container.onclick = function(){
				adress.set('message', row['id']);
			}

			// Редактирование сообщения
			var editMessage = function(){

				// AJAX:
				JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

					  action: 'check'
					, id: row['id']

				}, function(result, errors) { if (result['locked'] == null){ // что делаем, когда пришел ответ:

					wait.stop();

					var req = new JsHttpRequest();
					req.open(null, 'ajax_backend.php', true);
					req.send({action: 'lock_post', id: row['id']});

					var backupMsg = message.innerHTML;

					// создаем визивиг и элементы управления
					var editor = veditor();
					hide(infobar, controls);
					editor.panelInstance(message.id);
					e('@nicEdit-panel', container).style.paddingLeft = '47px';
					message.focus();
					var editControls = newel('div','controls');


					// программируем кнопки
					var cancelEdit = function(){
						remove(editControls);
						editor.removeInstance(message.id);
						editor.removePanel(message.id);
						unhide(infobar, controls);
						var req = new JsHttpRequest();
						req.open(null, 'ajax_backend.php', true);
						req.send({action: 'unlock_post', id: row['id']});

						wait.start();
					}

					var updateMessage = function(){
						editFields(['msg_body', message]);
						cancelEdit();
					}

					var cancelBtn = div('sbtn cancel', null, '<span>'+ txt['cancel'] +'</span>');
					var sendBtn = div('sbtn save', null, '<span>'+ txt['save'] +'</span>');
					cancelBtn.onclick = function(){
						cancelEdit();
						message.innerHTML = backupMsg;
					}
					sendBtn.onclick = updateMessage;

					// собираем конструктор
					container.appendChild(editControls);
					appendKids(editControls, cancelBtn, sendBtn, div('clearboth'));

				} else alert(txt['post_locked']); }, true ); // запрещать кеширование
			}

			// Удаление сообщения
			var deleteMessage = function(){

				JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

					  action: 'check'
					, id: row['id']

				}, function(result, errors) { if (result['locked'] == null){ // когда пришел ответ:

					var confirmed;

					if (result['is_topic'] != '0') {
						var isTopic = true;
						confirmed = confirm(txt['topic_del_confirm']);
					} else {
						confirmed = confirm(txt['msg_del_confirm']);
					}

					if (!confirmed) return;

					wait.stop();

					JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

						  action: 'delete'
						, id: row['id']

					}, function(result, errors) { // когда пришел ответ:

						if (result['maxdate']) {
							if (hasClass(container, 'lastblock') && prevElem(container)){
								addClass(prevElem(container), 'lastblock');
							}
							remove(container);

							if (isTopic) {
								contArea.innerHTML = '';
								var topicBlock = e('#topic_'+row['id']);
								if (topicBlock) remove(topicBlock);
							}

							consoleWrite('<b>Message deleted by user.</b> Max date set to '+result['maxdate'])

							//!! если работает - избавится от глобальной переменной и всегда явно передавать
							// значение в объект. Хотя, если не работает - возможно тоже
							maxPostDate = sql2stamp(result['maxdate']);
							//var mpd = sql2stamp(result['maxdate']);
						}

						wait.coldStart(); // холодный старт - потому что за время пока удалялось
						// сообщение маловероятно, чтобы кто-то что-то дописал, чего не скажешь
						// о редактировании и написании сообщение, поэтому там старт горячий

					}, true /* запрещать кеширование */ );

				} else alert (txt['post_locked']); }, true /* запрещать кеширование */ );
			}

			// Добавление сообщения
			var addMessage = function(button, plain){

				removeClass(controls, 'reveal');
				addClass(controls, 'invis');

				wait.stop();
				var date = new Date();

				// бекап функции
				var backupFunc = button.onclick;
				button.onclick = null;

				// добавление блока
				var answerBlock = div('add_message');
				if (!plain) addClass(answerBlock, 'branched');

				var form = newel('form');
				var msgParent = plain ? topicID : row['id']
				var textarea = newel('textarea', null, 'textarea_'+msgParent);

				insAfter(container, answerBlock);
				answerBlock.appendChild(form);
				form.appendChild(textarea);

				var editor = veditor();
				editor.panelInstance(textarea.id);

				e('@nicEdit-main', form).focus();

				var cancelMsg = function(){

					contArea.scrollTop -= answerBlock.offsetHeight;

					editor.removeInstance(textarea.id);
					editor.removePanel(textarea.id);

					remove(answerBlock);
					removeClass(controls, 'invis');
					addClass(controls, 'reveal');

					wait.start();

					button.onclick = backupFunc;
				}

				// отправка сообщения
				var sendMsg = function(){

					consoleWrite('previously checking new posts for this moment');

					// AJAX:
					JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

						action: 'wait_post'
						, topic: currentTopic
						, maxdate: maxPostDate

					}, function(result, errors) { // что делаем, когда пришел ответ:

						if (result['data']) {

							alert(txt['while_you_wrote']);
							wait.updatePosts(result['data'], result['maxdate']);

						} else { // если обновленных постов нет - размещаем таки новый пост

							send.onclick = null;

							textarea.disabled = true;
							textarea.className = 'throbber_gray';

							var msg_text = textarea.value || e('@nicEdit-main').innerHTML;
							var newBlock;

							// AJAX:
							JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

								  action: 'insert_post'
								, topic: topicID
								, parent: msgParent
								, message: msg_text

							}, function(result, errors) { // что делаем, когда пришел ответ:

								if (plain){

									removeClass(prevElem(answerBlock), 'lastblock');
									newBlock = branch.createBlock(result);

									var div = e('.post', branch.cont);
									div = div[div.length-1];

									insAfter(div, newBlock); // вставляем новый блок
									addClass(prevElem(answerBlock), 'lastblock');

									contArea.scrollTop += newBlock.offsetHeight;

								} else {

									unhide(collEx);
									var newBranch = new Branch(branch.cont, topicID, msgParent);
									newBranch.cont.style.borderLeft = '30px solid #cccccc';
									insAfter(container, newBranch.cont);
									newBranch.appendBlock(result);

								}

								maxPostDate = sql2stamp(result['created']);

								cancelMsg();

								consoleWrite('<b>Message was added by user.</b> Max date set to '+result['created']);

								// Дебажим:
								e('#debug').innerHTML = errors;

							}, true ); // запрещать кеширование

						}

					}, true ); // запрещать кеширование					
				}

				var answControls = div('controls');
				//form.appendChild(div('subtext w80', null, txt['how_to_send_post']));
				form.appendChild(answControls);

				form.appendChild(newel('div','clearboth'));

				var cancel = div('button', 'cancel_post', '<span>'+txt['cancel']+'</span>');
				var send = div('button', 'send_post', '<span>'+txt['send']+'</span>');
				answControls.appendChild(cancel);
				answControls.appendChild(send);

				cancel.onclick = cancelMsg;
				send.onclick = sendMsg;

				contArea.scrollTop += answerBlock.offsetHeight;
			}


			// добавляем кнопки
			//var branchBtn = addBtn('addbranch', txt['answer']);
			//branchBtn.onclick = function(){addMessage(branchBtn);}

			if (userID) {
				var plainBtn = addBtn('plainanswer', txt['answer']);
				plainBtn.onclick = function(){addMessage(plainBtn, 'plain');}
			}

			if (row['author_id'] == userID){

				addBtn('editmessage').onclick = editMessage;
				message.ondblclick = editMessage;
				// !! заглушка: сделать функцию удаления всей темы
				//if (row['id'] != topicID)
				addBtn('deletemessage').onclick = deleteMessage;

			}

			var collEx = addBtn('collex');
			hide(collEx);
			collEx.onclick = function(){alert('collapse/expand ');}

			controls.appendChild(explain);

		break;}

		// собираем конструктор воедино
		controls.appendChild(newel('div','clearboth'));

		appendKids(infobar, avatar, created, author, msgid, postcount, nuclear());
		appendKids(container, infobar, topic, message, lastpost, debug, controls, nuclear());

		return container;
	}

	this.appendBlock = function(row){
		var block = branch.createBlock(row);
		branch.cont.appendChild(block);
		addClass(block, 'lastblock');
		if (prevElem(block)) removeClass(prevElem(block), 'lastblock');
		return block;
	}
}

			
			
			
			

// Конструтор классов, спасибо Riim (javascript.ru)
var Class = (function() {

	var extend = Object.extend = function(self, obj) {
		if (self == null) self = {};
		for (var key in obj) self[key] = obj[key];
		return self;
	}

	return function(parent, declaration) {
		
		var Klass = function() {
			this.initialize.apply(this, arguments);
		}
		
		if (typeof parent == 'function') {
			function F(){}
			F.prototype = parent.prototype;
			Klass.prototype = new F();
		} else {
			if (parent != null) declaration = parent;
			parent = Object;
		}

		extend(Klass.prototype, declaration).initialize || (Klass.prototype.initialize = Function.blank);
		Klass.superclass = parent;
		Klass.prototype.superclass = parent.prototype;
		return Klass.prototype.constructor = Klass;
	};

})();

/*
var Class = function(parent, declaration) {
	
	var extend = Object.extend = function(self, obj) {
		if (self == null) self = {};
		for (var key in obj) self[key] = obj[key];
		return self;
	}
	
	var Klass = function() {
		this.initialize.apply(this, arguments);
	}
	
	if (typeof parent == 'function') {
		function F(){}
		F.prototype = parent.prototype;
		Klass.prototype = new F();
	} else {
		if (parent != null) declaration = parent;
		parent = Object;
	}
	
	extend(Klass.prototype, declaration).initialize || (Klass.prototype.initialize = Function.blank);
	Klass.$super = parent;
	Klass.prototype.$super = parent.prototype;
	return Klass.prototype.constructor = Klass;

}
*/
var Pa = Class({
	initialize: function(color) {
		this.populate(color);
	},

	populate: function(color) {
		this.container = div('container', 'empty');
		this.container.style.background = color;
	}
});

var Ci = Class(Pa, {
	populate: function(color) {
		Pa.prototype.populate.call(this, color);
		this.header = div('header', 'Заголовок!');
		this.container.appendChild(this.header);
	}
});

var GCi = Class(Ci, {
	populate: function(color) {
		Ci.prototype.populate.call(this, color);
		this.message = div('messge', 'Сообщение!');
		this.container.appendChild(this.message);
	}
});

			
// та самая extend		
function extend(Parent, Child) {
	var F = function() { }
	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
	Child.superclass = Parent.prototype;
}

// функция создания дива с классом и содержимым
function div(className, content){
	var elem = document.createElement('DIV');
	if (className) elem.className = className;
	if (content) elem.innerHTML = content;
	return elem;
}

// начинаем экспереметировать с наследованием по варианту 1 (не используем прототип, используем конструтор суперкласса)

function Parent(color){
	this.container = div('container');
	this.container.style.background = color;
	
	this.container.innerHTML += this.constructor;
}

extend(Parent, Child = function(){
	Child.superclass.constructor.apply(this, arguments);
	
	this.header = div('header', 'Заголовок!');
	this.container.appendChild(this.header);
});

extend(Child, GrandChild = function(){
	GrandChild.superclass.constructor.apply(this, arguments);
	
	this.message = div('messge', 'Сообщение!');
	this.container.appendChild(this.message);
});

// вариант 2, все свойства и методы добавляются через прототип: 

function P(color){
	this.populate(color);
}
P.prototype.populate = function(color){
	this.container = div('container', 'empty');
	this.container.style.background = color;
}

extend(P, C = function(color){
	this.populate(color);
});
C.prototype.populate = function(){
	P.prototype.populate.apply(this, arguments);
	this.header = div('header', 'Заголовок!');
	this.container.appendChild(this.header);
}

extend(C, GC = function(color){
	this.populate(color);
});
GC.prototype.populate = function(){
	C.prototype.populate.apply(this, arguments);
	this.message = div('messge', 'Сообщение!');
	this.container.appendChild(this.message);
}

 // func по прежнему недоступна, сама функция работает потому что все действия затолканы в конструктор

window.onload = function(){
	document.body.appendChild(new Parent('#7777FF').container); // выводит только "empty"
	document.body.appendChild(new Child('#9999FF').container); // выводит "empty" и "Заголовок!"
	document.body.appendChild(new GrandChild('#BBBBFF').container); // "empty", "Заголовок!" и "Сообщение!"
	
	document.body.appendChild(new P('#FF7777').container); // выводит только "empty"
	document.body.appendChild(new C('#FF9999').container); // работает нормально, выводит только empty
	document.body.appendChild(new GC('#FFbbbb').container); // func не наследуется
	
	document.body.appendChild(new Pa('#229922').container); // выводит только "empty"
	document.body.appendChild(new Ci('#55BB55').container); // выводит "empty" и "Заголовок!"
	document.body.appendChild(new GCi('#77EE77').container); // "empty", "Заголовок!" и "Сообщение!"
}
		</script>

	</head>

	<body>
		
	</body>
</html>