// Глобальные переменные
var currentTopic, maxPostDate, maxTopicDate, maxReadPost;
var branches = {};
var topics = {};


/* вешаем кнопки клавиатуры
document.onkeypress = function(event){
	var evt = event || window.event;
	var key = event.keyCode || event.which;
	col.scrollTop = col.scrollHeight;

	// срабатывать по alt+enter или ctrl+enter
	if ((evt.ctrlKey || evt.altKey) && key == 13){
		sendPost();
	}
}*/


// создает новый экземпляр визивига с указанными параметрами
// !! форматирование шрифтов невозможно из-за неправильной работы выпадающих списков
var veditor = function (){
	var editor = new nicEditor({
		buttonList:[
			'bold','italic','underline','strikethrough',
			'left','center','right','justify',
			'indent','outdent',
			//'forecolor',
			'ol','ul',
			'subscript','superscript',
			//'link','unlink','image',
			'hr',
			//'fontFormat',
			'removeformat'
			//,'xhtml'
		],
		xhtml:true,
		externalCSS: 'interface/nicedit.css',
		iconsPath : 'lib_modified/nicEditorIcons.gif'
	});
	return editor;
}


// расширение основного класса сообщения для десктопа
var DesktopMessageItem = Class ( MessageItem,{
	
	populate: function(){
		DesktopMessageItem.superclass.prototype.populate.apply(this, arguments);
		
		this.container.className += ' revealer';
		this.created.className += ' reveal';
		this.controls.className += ' reveal';
	},
	
	editFields: function (){

		var args = arguments;
		var jsonArgs = [];
		var that = this;

		for (var i=0; i<args.length; i++){
			jsonArgs[i] = {};
			jsonArgs[i]['field'] = args[i][0];
			jsonArgs[i]['data'] = args[i][1].innerHTML;
			addClass(args[i][1], 'updating');
		}

		JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

			  action: 'update'
			, fields: jsonArgs
			, id: this.row['id']

		}, function(result, errors) { // когда пришел ответ:

			for (var j=0; j<args.length; j++){
				args[j][1].innerHTML = result[j][jsonArgs[j]['field']];
				that.created.innerHTML = txt['modified'] + result[j]['msg_modified'];
				removeClass(args[j][1], 'updating');

				maxPostDate = sql2stamp(result[j]['msg_modified']);

				if (errors) console('error: '+errors);
			}

		}, true /* запрещать кеширование */ );
	},
	
	addBtn: function(name, caption){
		var btn = div('sbtn '+name, null, caption ? '<span>'+caption+'</span>' : null);
		this.controls.appendChild(btn);
		
		var that = this;

		btn.onmouseover = function(){
			that.explain.innerHTML = txt['explain_'+name];
		}
		btn.onmouseout = function(){
			that.explain.innerHTML = '';
		}
		
		return btn;
	}
});


// класс элемента темы
var TopicItem = Class( DesktopMessageItem, {
	
	// добавляем элементы
	populate: function(){
		TopicItem.superclass.prototype.populate.apply(this, arguments);
		
		if (this.row['last']['message']){
			this.lastpost = div('lastpost', 'lastpost_'+this.row['last']['id']);
			this.lastpost.innerHTML = txt['lastpost']+' <span class="author">'+this.row['last']['author']
				+'</span>' + ' ['+this.row['last']['created']+'] ' + this.row['last']['message'];
		}

		this.postcount = div('postcount reveal', null, this.row['postcount'] + txt['postcount']);

		// создаем элемент "тема"
		this.topicname = div('topicname editabletopic revealer2');
		this.topicfield = div('left', null, this.row['topic'] ? this.row['topic'] : '&nbsp;');
		this.topicedit_btn = div('sbtn btn_topicedit right reveal2');
		this.topicsubmit_btn = div('sbtn btn_topicsubmit right none');
		this.topiccancel_btn = div('sbtn btn_topiccancel right none');
	},
	
	// цепляем к ним действия
	attachActions: function(){
		TopicItem.superclass.prototype.attachActions.apply(this, arguments);
		var that = this;
		
		// вешаем на клик событие загрузки сообщений
		var clickload = function(){
			branches = {};
			fillPosts(that.row['id'], e('@contents', '#viewport_posts'));
			setCookie('currentTopic', that.row['id']);
			adress.set('topic', that.row['id']);
			adress.del('message');

			if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
			addClass(that.container, 'activetopic');
		}

		this.container.onclick = clickload;
		
		this.topicedit_btn.onmouseover = function(){
			that.container.onclick = null;
		}

		this.topicedit_btn.onmouseout = function(){
			if (!hasClass(that.topicfield, 'edittopicname')) that.container.onclick = clickload;
		}

		var cancelNameEdit = function(){
			hide(that.topicsubmit_btn, that.topiccancel_btn);
			unhide(that.topicedit_btn);
			that.topicfield.contentEditable = false;
			removeClass(that.topicfield, 'edittopicname');
			that.topicfield.ondblclick = editTopicName;
			that.container.onclick = clickload;
		}

		// функция инлайн-редактирования темы
		var editTopicName = function(){
			hide(that.topicedit_btn);
			that.topicfield.ondblclick = null;
			that.topicfield.contentEditable = true;
			var text = that.topicfield.innerHTML;
			that.topicfield.focus();
			addClass(that.topicfield, 'edittopicname');

			//!! дописать отмену и расположение кнопок
			var submitTopicName = function(){
				cancelNameEdit();

				// AJAX-запрос и заполнения поля
				that.editFields(['msg_topic', that.topicfield]);
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
			unhide(that.topicsubmit_btn, that.topiccancel_btn);

			that.topicsubmit_btn.onclick = submitTopicName;
			that.topiccancel_btn.onclick = cancelNameEdit;
		}

		// если имеем право переименовывать тему
		if (this.row['author_id'] == userID) {
			this.topicfield.ondblclick = editTopicName;
			this.topicedit_btn.onclick = editTopicName;
		}
	},
	
	// собираем элементы в DOM
	assemble: function(){
		TopicItem.superclass.prototype.assemble.apply(this, arguments);
		
		appendKids( this.topicname
			, this.topicfield
			, this.topicedit_btn
			, this.topiccancel_btn
			, this.topicsubmit_btn 
			, nuclear()
		);
	}
});


// класс элемента поста
var PostItem = Class( DesktopMessageItem, {
	
	populate: function(){
		PostItem.superclass.prototype.populate.apply(this, arguments);
		
		// вешаем маркер непрочитанности
		if (maxReadPost && maxReadPost < sql2stamp(this.row['modified'] || this.row['created']))
			addClass(this.container, 'unread');

		// вешаем ID на контейнер сообщения для возможности прикрепления визивига
		this.message.id = 'message_'+this.row['id'];

		this.avatar	= div('avatar', null, '<img src="'+this.row['avatar_url']+'">');
	},
	
	attachActions: function(){
		PostItem.superclass.prototype.attachActions.apply(this, arguments);
		var that = this;
		
		this.container.onclick = function(){
			adress.set('message', that.row['id']);
		}
		
		// Редактирование сообщения
		var editMessage = function(){

			// AJAX:
			JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

				  action: 'check'
				, id: that.row['id']

			}, function(result, errors) { if (result['locked'] == null){ // что делаем, когда пришел ответ:

				wait.stop();

				var req = new JsHttpRequest();
				req.open(null, 'ajax_backend.php', true);
				req.send({action: 'lock_post', id: that.row['id']});

				var backupMsg = that.message.innerHTML;

				// создаем визивиг и элементы управления
				var editor = veditor();
				hide(that.infobar, that.controls);
				editor.panelInstance(that.message.id);
				e('@nicEdit-panel', that.container).style.paddingLeft = '47px';
				that.message.focus();
				var editControls = div('controls');

				// программируем кнопки
				var cancelEdit = function(){
					remove(editControls);
					editor.removeInstance(that.message.id);
					editor.removePanel(that.message.id);
					unhide(that.infobar, that.controls);
					var req = new JsHttpRequest();
					req.open(null, 'ajax_backend.php', true);
					req.send({action: 'unlock_post', id: that.row['id']});

					wait.start();
				}

				var updateMessage = function(){
					that.editFields(['msg_body', that.message]);
					cancelEdit();
				}

				var cancelBtn = div('sbtn cancel', null, '<span>'+ txt['cancel'] +'</span>');
				var sendBtn = div('sbtn save', null, '<span>'+ txt['save'] +'</span>');
				cancelBtn.onclick = function(){
					cancelEdit();
					that.message.innerHTML = backupMsg;
				}
				sendBtn.onclick = updateMessage;

				// собираем конструктор
				that.container.appendChild(editControls);
				appendKids(editControls, cancelBtn, sendBtn, nuclear());

			} else alert(txt['post_locked']); }, true ); // запрещать кеширование
		}
		
		// Удаление сообщения
		var deleteMessage = function(){

			JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

				  action: 'check'
				, id: that.row['id']

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
					, id: that.row['id']

				}, function(result, errors) { // когда пришел ответ:

					if (result['maxdate']) {
						if (hasClass(that.container, 'lastblock') && prevElem(that.container)){
							addClass(prevElem(that.container), 'lastblock');
						}
						remove(that.container);

						if (isTopic) {
							that.contArea.innerHTML = ''; // !! contArea!!!!
							var topicBlock = e('#topic_'+that.row['id']);
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

			removeClass(that.controls, 'reveal');
			addClass(that.controls, 'invis');

			wait.stop();
			var date = new Date();

			// бекап функции
			var backupFunc = button.onclick;
			button.onclick = null;

			// добавление блока
			var answerBlock = div('add_message');
			if (!plain) addClass(answerBlock, 'branched');

			var form = newel('form');
			var msgParent = plain ? that.topicID : that.row['id']
			var textarea = newel('textarea', null, 'textarea_'+msgParent);

			insAfter(that.container, answerBlock);
			answerBlock.appendChild(form);
			form.appendChild(textarea);

			var editor = veditor();
			editor.panelInstance(textarea.id);

			e('@nicEdit-main', form).focus();

			var cancelMsg = function(){

				that.contArea.scrollTop -= answerBlock.offsetHeight;

				editor.removeInstance(textarea.id);
				editor.removePanel(textarea.id);

				remove(answerBlock);
				removeClass(that.controls, 'invis');
				addClass(that.controls, 'reveal');

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
							, topic: that.topicID
							, parent: msgParent
							, message: msg_text

						}, function(result, errors) { // что делаем, когда пришел ответ:

							if (plain){

								removeClass(prevElem(answerBlock), 'lastblock');
								newBlock = new PostItem(result, 'post', that.contArea, that.topicID, that.branch);
								newBlock = newBlock.container;
									
								// вычисляем последний пост в ветке
								var ediv = e('.post', that.branch.cont);
								ediv = ediv[ediv.length-1];

								insAfter(ediv, newBlock); // вставляем новый блок
								addClass(prevElem(answerBlock), 'lastblock');

								that.contArea.scrollTop += newBlock.offsetHeight;

							} else {

								unhide(collEx);
								var newBranch = new Branch(that.branch.cont, that.topicID, msgParent);
								newBranch.cont.style.borderLeft = '30px solid #cccccc';
								insAfter(that.container, newBranch.cont);
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

			form.appendChild(nuclear());

			var cancel = div('button', 'cancel_post', '<span>'+txt['cancel']+'</span>');
			var send = div('button', 'send_post', '<span>'+txt['send']+'</span>');
			answControls.appendChild(cancel);
			answControls.appendChild(send);

			cancel.onclick = cancelMsg;
			send.onclick = sendMsg;

			that.contArea.scrollTop += answerBlock.offsetHeight;
		}
		
		// добавляем кнопки
		//var branchBtn = addBtn('addbranch', txt['answer']);
		//branchBtn.onclick = function(){addMessage(branchBtn);}

		if (userID) {
			var plainBtn = this.addBtn('plainanswer', txt['answer']);
			plainBtn.onclick = function(){addMessage(plainBtn, 'plain');}
		}

		if (this.row['author_id'] == userID){

			this.addBtn('editmessage').onclick = editMessage;
			this.message.ondblclick = editMessage;
			this.addBtn('deletemessage').onclick = deleteMessage;
		}
		
		var collEx = this.addBtn('collex none');
		collEx.onclick = function(){alert('collapse/expand ');}

		this.controls.appendChild(this.explain);
	},
	
	assemble: function(){
		PostItem.superclass.prototype.assemble.apply(this, arguments);
		
		this.controls.appendChild(nuclear());
	}
});


var Branch = function(contArea, topicID, parentID){
	if (!parentID) parentID = topicID;

	// чтобы this функций не забивал this объекта
	var that = this;

	// указание на элемент, в который вставляется новый контейнер
	this.e = contArea;

	// создание контейнера для новой ветки
	this.cont = div(null, 'branch_'+parentID);
	this.e.appendChild(this.cont);
	
	this.createBlock = function(row){
		var elem = (topicID == '0') ? new TopicItem(row, 'topic') : new PostItem(row, 'post', contArea, topicID, that);
		return elem.container;
	}
	
	this.appendBlock = function(row){
		var block = that.createBlock(row);
		that.cont.appendChild(block);
		addClass(block, 'lastblock');
		if (prevElem(block)) removeClass(prevElem(block), 'lastblock');
		return block;
	}
}


// заполняет колонку сообщениями
function fillPosts(parent, container) {

	if (wait.postsInterv) wait.stop();
	
	var tbar = e('@titlebar', '#viewport_posts');
	var sbar = e('@statusbar', '#viewport_posts');

	addClass(tbar, 'tbar_throbber');
	container.innerHTML = '';

	// запоминаем время начала выполнения запроса
	var d = new Date;
	var before = d.getTime();

	// AJAX:
	JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

		  action: 'load_posts'
		, id: parent

	}, function(result, errors) { // что делаем, когда пришел ответ:

		removeClass(tbar, 'tbar_throbber');

		maxReadPost = sql2stamp(result['maxread']);

		branches[parent] = new Branch (container, parent);
		var cont = branches[parent];
		
		// создаем экземпляр содержимого колонки и заполняем его

		for (var i in result['data']) {
			cont.appendBlock(result['data'][i]);
		}

		maxPostDate = sql2stamp(result['maxdate']);

		// прокрутка до указанного поста или в конец
		var refPost;
		if ((refPost = adress.get('message')) && e('#post_'+refPost)) {
			e('#post_'+refPost).scrollIntoView();
		} else {
			cont.e.scrollTop = cont.e.scrollHeight; // прокручиваем до конца
		}
		// что по прокрутке делаем
		cont.e.onscroll = function(){
			sbar.innerHTML = cont.e.scrollTop+cont.e.offsetHeight;
		}
		// пишем тему в заголовке колонки сообщения
		// !! при переименовании уже загруженной темы она должна переименовываться также и в заголовке
		tbar.innerHTML = txt['topic']+': '+result['topic'];

		currentTopic = parent;
		if (e('#topic_'+parent)) removeClass(e('#topic_'+parent), 'unread');

		consoleWrite('posts loaded for topic '+parent+' ('+result['topic'].replace('<br>','')+')');
		if (!wait.postsInterv) wait.start('cold');

		sbar.innerHTML = finalizeTime(before)+'ms';

		var ntBut = e('@newtopic', '#viewport_posts');
		ntBut.onclick = function(){newTopic(ntBut)};

		// Дебажим:

		e('#debug').innerHTML = errors;
		sbar.innerHTML += ' | '+cont.e.scrollTop;

	}, true /* запрещать кеширование */ );
}


function fillTopics(){

	var container = e('@contents', '#viewport_topics');
	var tbar = e('@titlebar', '#viewport_topics');
	var sbar = e('@statusbar', '#viewport_topics');

	addClass(tbar, 'tbar_throbber');

	// запоминаем время начала выполнения запроса
	var d = new Date;
	var before = d.getTime();

	// AJAX:
	JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

		  action: 'load_topics'
		  , sort: 'updated'
		  , reverse: 'true'

	}, function(result, errors) { // что делаем, когда пришел ответ:

		container.innerHTML = '';
		removeClass(tbar, 'tbar_throbber');

		topics = new Branch (container, 0);

		sbar.innerHTML = finalizeTime(before)+'ms';

		// создаем экземпляр содержимого колонки и заполняем его
		for (var i in result['data']) {
			//if(!first) var first = result['data'][i];
			topics.appendBlock(result['data'][i]);
		}

		maxTopicDate = sql2stamp(result['maxdate']);
		
		var active = e('#topic_'+adress.get('topic'));

		if (active){
			addClass(active, 'activetopic');
			active.scrollIntoView(false);
		}

		// Дебажим:
		consoleWrite('topic list loaded');

		e('#debug').innerHTML = errors;
		sbar.innerHTML += ' | '+topics.e.scrollTop;

	}, true /* запрещать кеширование */ );
}

function newTopic(btn){

	var backup = btn.onclick;
	btn.onclick = null;

	wait.stop();

	if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
	e('@titlebar', '#viewport_posts').innerHTML = txt['new_topic'];

	var cont = e('@contents', '#viewport_posts');
		cont.innerHTML = '';
	var ntBlock = div('add_message');
	var form = newel('form', null, 'newtopic');
	var textarea = newel('textarea', null, 'textarea_0');
	var title = newel('input', 'topic_name');
		title.name = 'topic';
		title.type = 'text';
	var answControls = div('controls');
	var cancel = div('button', 'cancel_post', '<span>'+txt['cancel']+'</span>');
	var send = div('button', 'send_post', '<span>'+txt['send']+'</span>');

	var cancelMsg = function(){
		btn.onclick = backup;
		remove (ntBlock);
		branches = {};
		fillPosts(currentTopic, e('@contents', '#viewport_posts'));
		addClass(e('#topic_'+currentTopic), 'activetopic');
	}

	var sendMsg = function(){

		var msg_text = textarea.value || e('@nicEdit-main').innerHTML;

		// AJAX:
		JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

			  action: 'insert_post'
			, message: msg_text
			, title: title.value
			, topic: '0'
			, parent: '0'

		}, function(result, errors) { // что делаем, когда пришел ответ:

			if (topics) {
				insBefore(e('[div]', topics.cont), topics.createBlock(result));
			} else fillTopics(); // если темы не загружены

			currentTopic = result['id'];
			cancelMsg();

		}, true ); // запрещать кеширование
	}

	cont.appendChild(ntBlock);
		ntBlock.appendChild(form);
			form.appendChild(title);
			form.appendChild(textarea);
			//form.appendChild(div('subtext w80', null, txt['how_to_send_post']));
			form.appendChild(answControls);
				answControls.appendChild(cancel);
				answControls.appendChild(send);
			form.appendChild(newel('div','clearboth'));
			
	var editor = veditor();
	editor.panelInstance(textarea.id);
	
	cancel.onclick = cancelMsg;
	send.onclick = sendMsg;

	title.focus();
}


// эта функция будет обновлять темы
/*
function long_updater(topic, maxdate){

	// временно в первой колонке
	var tbar = e('@titlebar', '#viewport_menu');
	addClass(tbar, 'tbar_throbber');
	var count = 1;

	var interval = setInterval(function(){e('@contents', '#viewport_menu').innerHTML = count++}, 1000);

	// AJAX:
	var req = new JsHttpRequest();
	req.onreadystatechange = function() {if (req.readyState == 4) {

		clearInterval(interval);
		removeClass(tbar, 'tbar_throbber');
		e('@contents', '#viewport_menu').innerHTML = req.responseJS;
		e('#debug0').innerHTML = req.responseText;

	}}
	req.open(null, 'ajax_backend.php', true);
	req.send({

		action: 'long_wait_post'
		, topic: topic
		, maxdate: maxdate

	});

	return req;
}
*/

function Updater(){

	var that = this;
	var postsWtime = cfg['posts_updtimer_blurred']*1000;
	var topicsWtime = cfg['topics_updtimer_blurred']*1000;
	this.postsInterv = null;
	this.topicsInterv = null;
	var tbarP = e('@titlebar', '#viewport_posts');
	var tbarT = e('@titlebar', '#viewport_topics');
	var mbarT = e('@toolbar', '#viewport_topics');

	this.updatePosts = function(upds, maxd){

		var row, branch;

		for (var i in upds){ row = upds[i];

			if (!branches[row['parent']]) return; // если ветки с таким идентификатором нет
			branch = branches[row['parent']];

			var container = e('#post_'+row['id']);

			if (container && row['deleted']){ // это изменение - удаление поста

				if (hasClass(container, 'lastblock')) addClass(prevElem(container), 'lastblock');
				remove(container);
				consoleWrite('message #'+row['id']+' found as deleted -> removed from view');

			} else if (container) { // это изменение - редактирование поста

				e('@created', container).innerHTML = txt['modified'] + row['modified'];
				e('@message', container).innerHTML = row['message'];
				addClass(container, 'unread');
				consoleWrite('message #'+row['id']+' found as edited -> modified in view');

			} else { // поста с таким айди нет, значит это новый пост

				var newBlock = branch.createBlock(row);
				var div = e('.post', branch.cont);
				div = div[div.length-1];
				insAfter(div, newBlock);
				addClass(newBlock, 'lastblock');
				if (prevElem(newBlock)) removeClass(prevElem(newBlock), 'lastblock');
				e('@contents', '#viewport_posts').scrollTop += newBlock.offsetHeight;
				consoleWrite('message #'+row['id']+' found as new -> added to view');
			}
		}
		maxPostDate = sql2stamp(maxd);
	}

	this.updateTopics = function(upds, maxd, quant){
		var row, topic, topicFirst, post;

		for (var i in upds){ row = upds[i];
			topic = e('#topic_'+i);

			// поднять наверх
			topicFirst = e('@topic', '#viewport_topics');
			if (topic != topicFirst){
				remove(topic);
				insBefore(topicFirst, topic);
			}

			// пометить классом
			if (!hasClass(topic, 'unread') && !hasClass(topic, 'activetopic')) addClass(topic, 'unread');
			if (hasClass(topic, 'activetopic')) topic.scrollIntoView(false);

			e('@postcount', topic).innerHTML = quant[i]+txt['postcount'];

			// если пришли данные - вбить
			if (row.constructor == Array){

				for (var j in row){ post = row[j]

					if (topic.id == 'topic_'+post['id']){
						e('@created', topic).innerHTML = post['modified'] ? txt['modified']+post['modified'] : post['created'];
						e('@topicname', topic).innerHTML = post['topic'];
						e('@message', topic).innerHTML = post['message'];
					} else {
						e('@lastpost', topic).innerHTML = txt['lastpost']+' <span class="author">'
						+post['author']+'</span> ['+post['maxdate']+'] '+post['message'];
					}
				}
			}
		}

		maxTopicDate = sql2stamp(maxd);
	}

	var checkPosts = function (topic, maxdate){

		addClass(tbarP, 'tbar_updating');

		var date = new Date();

		consoleWrite('for last date '+stamp2sql(maxdate)+' -> request sent', true);

		// AJAX:
		JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

			action: 'wait_post'
			, topic: topic
			, maxdate: maxdate

		}, function(result, errors) { // что делаем, когда пришел ответ:

			consoleWrite('for last date '+result['console']+' changes returned in '+getTimeDiff(date)+' seconds', true);

			removeClass(tbarP, 'tbar_updating');
			e('#debug0').innerHTML = errors;

			if (result['data']) that.updatePosts(result['data'], result['maxdate']);

		}, true ); // запрещать кеширование
	}

	var checkTopics = function(maxdate){

		addClass(tbarT, 'tbar_updating');

		var date = new Date();

		consoleWrite('TOPICS: for last date '+stamp2sql(maxdate)+' -> request sent', true);

		// AJAX:
		JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

			action: 'wait_topic'
			, maxdate: maxdate

		}, function(result, errors) { // что делаем, когда пришел ответ:

			consoleWrite('TOPICS: for last date '+result['console']+' changes returned in '+getTimeDiff(date)+' seconds', true);

			removeClass(tbarT, 'tbar_updating');
			e('#debug0').innerHTML = errors;

			if (result['data']) that.updateTopics(result['data'], result['maxdate'], result['quant']);

			mbarT.innerHTML = result['new_quant'];

		}, true ); // запрещать кеширование
	}

	this.start = function(cold, mpd){
		if (that.postsInterv) {
			colsole('waiter can not be started, because it is allready running');
			return;
		}

		addClass(tbarP, 'tbar_waiting');
		addClass(tbarT, 'tbar_waiting');

		if (cold != 'cold'){
			consoleWrite('waiter started (hot start) with interval '+(postsWtime/1000)+'s for posts, '+(topicsWtime/1000)+'s for topics');
			setTimeout(function(){checkPosts(currentTopic, mpd ? mpd : maxPostDate)}, 1000);
			setTimeout(function(){checkTopics(maxTopicDate)}, 1000);
		} else consoleWrite('waiter started (cold start) with interval '+(postsWtime/1000)+'s');

		that.postsInterv = setInterval(function(){checkPosts(currentTopic, mpd ? mpd : maxPostDate);}, postsWtime);
		that.topicsInterv = setInterval(function(){checkTopics(maxTopicDate);}, topicsWtime);
	}

	this.coldStart = function(){
		that.start('cold');
	}

	this.stop = function(){
		if (!that.postsInterv){
			consoleWrite ('waiter is not running, cant stop');
			return;
		}
		removeClass(tbarP, 'tbar_waiting');
		removeClass(tbarT, 'tbar_waiting');
		clearInterval(that.postsInterv);
		clearInterval(that.topicsInterv);
		that.postsInterv = null;
		that.topicsInterv = null;
		consoleWrite ('waiter stopped');
	}

	this.lock = false;

	// изменить время ожидания. !! Возможно стоит добавить "горячий" старт
	this.timeout = function(secondsP, secondsT, lock){

		if (lock == 'unlock') that.lock = false;

		if (!that.lock){
			postsWtime = secondsP*1000;
			topicsWtime = secondsT*1000;
			if (that.postsInterv) {
				clearInterval(that.postsInterv);
				clearInterval(that.topicsInterv);
				setTimeout(function(){checkPosts(currentTopic, maxPostDate)}, 1000);
				setTimeout(function(){checkTopics(maxTopicDate)}, 1000);
				that.postsInterv = setInterval(function(){checkPosts(currentTopic, maxPostDate);}, postsWtime);
				that.topicsInterv = setInterval(function(){checkTopics(maxTopicDate);}, topicsWtime);
				consoleWrite('waiter restarted with interval '+secondsP+'s for posts'+(lock == 'lock' ? ' (with lock)' : ''));
			} else consoleWrite('interval changed to '+secondsP+'s for posts and '+secondsT+'s for topics');
		}

		if (lock == 'lock') that.lock = true;
	}

	this.restart = function(cold){
		this.stop();
		this.start(cold);
	}

	this.toggle = function(){
		if (that.postsInterv) that.stop();
		else that.start();
	}
}


function startEngine(){
	wait = new Updater;
	fillTopics();

	if ((currentTopic = adress.get('topic'))){
		branches = {};
		fillPosts(currentTopic, e('@contents', '#viewport_posts'));
	}

	e('@titlebar', '#viewport_posts').onclick = wait.toggle;
}


function focusDoc(){
	var p = focusDoc.arguments;
	if (wait) wait.timeout(cfg['posts_updtimer_focused'], cfg['topics_updtimer_focused']);
	e('#logo').style.color = 'red';
	//consoleWrite('focus actions performed');
}

function blurDoc(){
	var p = blurDoc.arguments;
	if (wait) wait.timeout(cfg['posts_updtimer_blurred'], cfg['topics_updtimer_blurred']);
	e('#logo').style.color = 'blue';
	//consoleWrite('blur actions performed');
}

/*

// AJAX:
JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

	action: 'load_posts'

}, function(result, errors) { // что делаем, когда пришел ответ:

}, true ); // запрещать кеширование

===============

var req = new JsHttpRequest();
req.onreadystatechange = function() { if (req.readyState == 4) {



}}
req.open(null, 'ajax_backend.php', true);
req.send({

	action: 'wait_post'

});

*/