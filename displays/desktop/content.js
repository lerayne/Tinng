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


// Универсальный класс ветки
function Branch (contArea, topicID, parentID) {
	if (!parentID) parentID = topicID;

	// чтобы this функций не забивал this объекта
	var branch = this;

	// указание на элемент, в который вставляется новый контейнер
	this.e = contArea;

	// создание контейнера для новой ветки
	this.cont = newel('div', null, 'branch_'+parentID);
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
			var btn = newel('div', 'sbtn '+name, null, caption ? '<span>'+caption+'</span>' : null);
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
		var container	= newel('div', type+' revealer', type+'_'+row['id']);
		var infobar		= newel('div', 'infobar');
		var msgid		= newel('div', 'msgid', null, '&nbsp;#'+row['id']+'&nbsp;')
		var created		= newel('div', 'created reveal');
		var author		= newel('div', 'author', null, txt['from']+row['author']);
		var message		= newel('div', 'message', null, row['message']);
		var debug		= newel('div');
		var controls	= newel('div', 'controls reveal');
		var explain		= newel('div', 'explain subtext');

		created.innerHTML = row['modified'] ? txt['modified'] + row['modified'] : row['created'];

		// действия в зависимости от типа блока
		switch (type){
		case 'topic':

			//debug.innerHTML = row['updated'];

			// вешаем на клик событие загрузки сообщений
			container.onclick = function(){
				branches = {};
				fillPosts(row['id'], e('#content_2'));
				setCookie('currentTopic', row['id']);
				adress.set('topic', row['id']);
				adress.del('message');

				if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
				addClass(container, 'activetopic');
			}

			if (row['last']['message']){
				var lastpost = newel('div', 'lastpost');
				lastpost.innerHTML = txt['lastpost']+' <span class="author">'+row['last']['author']+'</span>';
				lastpost.innerHTML += ' ['+row['last']['created']+'] ';
				lastpost.innerHTML += row['last']['message'];
			}

			var postcount = newel('div', 'postcount reveal', null, row['postcount'] + txt['postcount']);

			// создаем элемент "тема"
			var topic = newel('div', 'topicname editabletopic', null,
				row['topic'] ? row['topic'] : '&nbsp;');

			// функция инлайн-редактирования темы
			var editTopicName = function(){
				topic.ondblclick = null;
				topic.contentEditable = true;
				var text = topic.innerHTML;
				topic.focus();
				addClass(topic, 'edittopicname');

				var okbtn = insAfter(topic, newel('div', 'okbtn', null));

				//!! дописать отмену и расположение кнопок
				var submitTopicName = function(){
					removeClass(topic, 'edittopicname');
					topic.ondblclick = editTopicName;
					remove(okbtn);
					topic.contentEditable = false;

					// !! не работает. попробовать регекспом
					if (topic.innerHTML == ''){
						topic.innerHTML = text;
						return;
					}

					// AJAX-запрос и заполнения поля
					editFields(['msg_topic', topic]);
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
				okbtn.onclick = submitTopicName;
			}

			// если имеем право переименовывать тему
			if (row['author_id'] == userID) {topic.ondblclick = editTopicName;}

		break;
		case 'post':

			//debug.innerHTML += maxReadPost;

			if (maxReadPost && maxReadPost < sql2stamp(row['modified'] || row['created']))
				addClass(container, 'unread');

			// вешаем ID на контейнер сообщения для возможности прикрепления визивига
			message.id = 'message_'+row['id'];

			var avatar	= newel('div', 'avatar', null, '<img src="'+row['avatar_url']+'">');

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

					var cancelBtn = newel('div', 'sbtn cancel', null, '<span>'+ txt['cancel'] +'</span>');
					var sendBtn = newel('div', 'sbtn save', null, '<span>'+ txt['save'] +'</span>');
					cancelBtn.onclick = function(){
						cancelEdit();
						message.innerHTML = backupMsg;
					}
					sendBtn.onclick = updateMessage;

					// собираем конструктор
					container.appendChild(editControls);
					appendKids(editControls, cancelBtn, sendBtn, newel('div', 'clearboth'));

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
							if (ifClass(container, 'lastblock') && prevElem(container)){
								addClass(prevElem(container), 'lastblock');
							}
							remove(container);

							if (isTopic) {
								contArea.innerHTML = '';
								var topicBlock = e('#topic_'+row['id']);
								if (topicBlock) remove(topicBlock);
							}

							console('<b>Message deleted by user.</b> Max date set to '+result['maxdate'])

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
				var answerBlock = newel('div', 'add_message');
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

					console('previously checking new posts for this moment');

					// AJAX:
					JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

						action: 'wait_post'
						, topic: currentTopic
						, maxdate: maxPostDate

					}, function(result, errors) { // что делаем, когда пришел ответ:

						if (result['data']) {

							alert(txt['while_you_wrote']);
							wait.update(result['data'], result['maxdate']);

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

								console('<b>Message was added by user.</b> Max date set to '+result['created']);

								// Дебажим:
								e('#debug').innerHTML = errors;

							}, true ); // запрещать кеширование

						}

					}, true ); // запрещать кеширование					
				}

				var answControls = newel('div', 'controls');
				//form.appendChild(newel('div', 'subtext w80', null, txt['how_to_send_post']));
				form.appendChild(answControls);

				form.appendChild(newel('div','clearboth'));

				var cancel = newel('div', 'button', 'cancel_post', '<span>'+txt['cancel']+'</span>');
				var send = newel('div', 'button', 'send_post', '<span>'+txt['send']+'</span>');
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

		appendKids(infobar, avatar, created, author, msgid, postcount, newel('div','clearboth'));
		appendKids(container, infobar, topic, message, lastpost, debug, controls, newel('div','clearboth'));

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




// заполняет колонку сообщениями
function fillPosts(parent, container) {

	if (wait.interv) wait.stop();

	var col = container.id.replace('content_', '');
	var tbar = e('@col_titlebar', '#col_'+col);
	var sbar = e('@col_statusbar', '#col_'+col);

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

		console('posts loaded for topic '+parent+' ('+result['topic'].replace('<br>','')+')');
		if (!wait.interv) wait.start('cold');

		sbar.innerHTML = finalizeTime(before)+'ms';

		var ntBut = e('@newtopic', '#col_2');
		ntBut.onclick = function(){newTopic(ntBut)};

		// Дебажим:

		e('#debug').innerHTML = errors;
		sbar.innerHTML += ' | '+cont.e.scrollTop;

	}, true /* запрещать кеширование */ );
}


function fillTopics(){

	var container = e('#content_1');
	var col = container.id.replace('content_', '');
	var tbar = e('@col_titlebar', '#col_'+col);
	var sbar = e('@col_statusbar', '#col_'+col);

	addClass(tbar, 'tbar_throbber');

	// запоминаем время начала выполнения запроса
	var d = new Date;
	var before = d.getTime();

	// AJAX:
	JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

		  action: 'load_topics'

	}, function(result, errors) { // что делаем, когда пришел ответ:

		container.innerHTML = '';
		removeClass(tbar, 'tbar_throbber');

		topics = new Branch (container, 0);

		sbar.innerHTML = finalizeTime(before)+'ms';

		// создаем экземпляр содержимого колонки и заполняем его
		for (var i in result['data']) {
			if(!first) var first = result['data'][i];
			topics.appendBlock(result['data'][i]);
		}
		
		var active = e('#topic_'+adress.get('topic'));

		if (active){
			addClass(active, 'activetopic');
			active.scrollIntoView(false);
		}

		// Дебажим:
		console('topic list loaded');

		e('#debug').innerHTML = errors;
		sbar.innerHTML += ' | '+topics.e.scrollTop;

	}, true /* запрещать кеширование */ );
}

function newTopic(btn){

	var backup = btn.onclick;
	btn.onclick = null;

	wait.stop();

	if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
	e('@col_titlebar', '#col_2').innerHTML = txt['new_topic'];

	var cont = e('#content_2');
		cont.innerHTML = '';
	var ntBlock = newel('div', 'add_message');
	var form = newel('form', null, 'newtopic');
	var textarea = newel('textarea', null, 'textarea_0');
	var title = newel('input', 'topic_name');
		title.name = 'topic';
		title.type = 'text';
	var answControls = newel('div', 'controls');
	var cancel = newel('div', 'button', 'cancel_post', '<span>'+txt['cancel']+'</span>');
	var send = newel('div', 'button', 'send_post', '<span>'+txt['send']+'</span>');

	var cancelMsg = function(){
		btn.onclick = backup;
		remove (ntBlock);
		branches = {};
		fillPosts(currentTopic, e('#content_2'));
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
			//form.appendChild(newel('div', 'subtext w80', null, txt['how_to_send_post']));
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
	var tbar = e('@col_titlebar', '#col_0');
	addClass(tbar, 'tbar_throbber');
	var count = 1;

	var interval = setInterval(function(){e('#content_0').innerHTML = count++}, 1000);

	// AJAX:
	var req = new JsHttpRequest();
	req.onreadystatechange = function() {if (req.readyState == 4) {

		clearInterval(interval);
		removeClass(tbar, 'tbar_throbber');
		e('#content_0').innerHTML = req.responseJS;
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
	var wtime = cfg['posts_updtimer_blurred']*1000;
	this.interv = null;
	var tbar = e('@col_titlebar', '#col_2');

	this.update = function(upds, maxd){

		var row, branch;

		for (var i in upds){ row = upds[i];

			if (!branches[row['parent']]) return; // если ветки с таким идентификатором нет
			branch = branches[row['parent']];

			var container = e('#post_'+row['id']);

			if (container && row['deleted']){ // это изменение - удаление поста

				if (ifClass(container, 'lastblock')) addClass(prevElem(container), 'lastblock');
				remove(container);
				console('message #'+row['id']+' found as deleted -> removed from view');

			} else if (container) { // это изменение - редактирование поста

				e('@created', container).innerHTML = txt['modified'] + row['modified'];
				e('@message', container).innerHTML = row['message'];
				addClass(container, 'unread');
				console('message #'+row['id']+' found as edited -> modified in view');

			} else { // поста с таким айди нет, значит это новый пост

				var newBlock = branch.createBlock(row);
				var div = e('.post', branch.cont);
				div = div[div.length-1];
				insAfter(div, newBlock);
				addClass(newBlock, 'lastblock');
				if (prevElem(newBlock)) removeClass(prevElem(newBlock), 'lastblock');
				e('#content_2').scrollTop += newBlock.offsetHeight;
				console('message #'+row['id']+' found as new -> added to view');
			}
		}
		maxPostDate = sql2stamp(maxd);
	}

	var check = function (topic, maxdate){

		addClass(tbar, 'tbar_updating');

		var date = new Date();

		console('for last date '+stamp2sql(maxdate)+' -> request sent', true);

		// AJAX:
		JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

			action: 'wait_post'
			, topic: topic
			, maxdate: maxdate

		}, function(result, errors) { // что делаем, когда пришел ответ:

			console('for last date '+result['console']+' changes returned in '+getTimeDiff(date)+' seconds', true);

			removeClass(tbar, 'tbar_updating');
			e('#debug0').innerHTML = errors;

			if (result['data']) that.update(result['data'], result['maxdate']);

		}, true ); // запрещать кеширование
	}

	this.start = function(cold, mpd){
		if (that.interv) {
			colsole('waiter can not be started, because it is allready running');
			return;
		}

		addClass(tbar, 'tbar_waiting');

		if (cold != 'cold'){
			console('waiter started (hot start) with interval '+(wtime/1000)+'s');
			setTimeout(function(){check(currentTopic, mpd ? mpd : maxPostDate)}, 1000);
		} else console('waiter started (cold start) with interval '+(wtime/1000)+'s');

		that.interv = setInterval(function(){check(currentTopic, mpd ? mpd : maxPostDate);}, wtime);
	}

	this.coldStart = function(){
		that.start('cold');
	}

	this.stop = function(){
		if (!that.interv){
			console ('waiter is not running, cant stop');
			return;
		}
		removeClass(tbar, 'tbar_waiting');
		clearInterval(that.interv);
		that.interv = null;
		console ('waiter stopped');
	}

	this.lock = false;

	// изменить время ожидания. !! Возможно стоит добавить "горячий" старт
	this.timeout = function(seconds, lock){

		if (lock == 'unlock') that.lock = false;

		if (!that.lock){
			wtime = seconds*1000;
			if (that.interv) {
				clearInterval(that.interv);
				setTimeout(function(){check(currentTopic, maxPostDate)}, 1000);
				that.interv = setInterval(function(){check(currentTopic, maxPostDate);}, wtime);
				console('waiter restarted with interval '+seconds+'s'+(lock == 'lock' ? ' (with lock)' : ''));
			} else console('interval changed to '+seconds+'s');
		}

		if (lock == 'lock') that.lock = true;
	}

	this.restart = function(cold){
		this.stop();
		this.start(cold);
	}

	this.toggle = function(){
		if (that.interv) that.stop();
		else that.start();
	}
}


function startEngine(){
	wait = new Updater;
	fillTopics();

	if ((currentTopic = adress.get('topic'))){
		branches = {};
		fillPosts(currentTopic, e('#content_2'));
	}

	e('@col_titlebar', '#col_2').onclick = wait.toggle;
}


function focusDoc(){
	var p = focusDoc.arguments;
	if (wait) wait.timeout(cfg['posts_updtimer_focused']);
	e('#test').style.backgroundColor = 'red';
	//console('focus actions performed');
}

function blurDoc(){
	var p = blurDoc.arguments;
	if (wait) wait.timeout(cfg['posts_updtimer_blurred']);
	e('#test').style.backgroundColor = 'blue';
	//console('blur actions performed');
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