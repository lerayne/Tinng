// Глобальные переменные
var maxPostDate, maxTopicDate, maxReadPost;
var currentTopic = 0;
var branches = {};
var topics = {};
var messages = {};


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


// расширение основного класса сообщения для десктопа
var DesktopMessageItem = Class ( MessageItem, {
	
	// добавляем проявители
	createElems: function(){
		DesktopMessageItem.superclass.prototype.createElems.apply(this, arguments);
		
		addClass(this.item, 'revealer');
		addClass(this.created, 'reveal');
		addClass(this.controls, 'reveal');
	},
	
	// добавляем функцию редактирования полей
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

				if (errors) consoleWrite('error: '+errors);
			}

		}, true /* запрещать кеширование */ );
	},
	
	// добавляем функцию создания кнопки
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
	createElems: function(){
		TopicItem.superclass.prototype.createElems.apply(this, arguments);
		
		this.item.id = 'topic_'+this.row['id'];
		addClass(this.item, 'topic');
		
		if (this.row['last'] && this.row['last']['message'])
			this.lastpost = div('lastpost', 'lastpost_'+this.row['last']['id']);

		this.postsquant = div('postsquant reveal');

		// создаем элемент "тема"
		this.topicname = div('topicname editabletopic revealer2');
		this.topicfield = div('left');
		this.topicedit_btn = div('sbtn btn_topicedit right reveal2');
		this.topicsubmit_btn = div('sbtn btn_topicsubmit right none');
		this.topiccancel_btn = div('sbtn btn_topiccancel right none');
	},
	
	
	// заполняем их данными
	fillData: function(){
		TopicItem.superclass.prototype.fillData.apply(this, arguments);
		
		if (this.lastpost)
			this.lastpost.innerHTML = txt['lastpost']+' <span class="author">'+this.row['last']['author']
				+'</span>' + ' ['+this.row['last']['created']+'] ' + this.row['last']['message'];
		
		this.postsquant.innerHTML = /*this.row['postsquant']*/ '1' + txt['postsquant'];
		this.topicfield.innerHTML = this.row['topic'] ? this.row['topic'] : '&nbsp;';
	},
	
	
	// альтернативная вариация lastpost, когда он подается в отдельном массиве
	fillLast: function(lpost){
		
		this.lpost = lpost;
		
		if (!this.lastpost){
			this.lastpost = div('lastpost', 'lastpost_'+this.lpost['id']);
			insAfter(this.message, this.lastpost);
		}
		
		this.lastpost.innerHTML =  txt['lastpost']+' <span class="author">'+this.lpost['author']
				+'</span>' + ' ['+this.lpost['created']+'] ' + this.lpost['message'];
			
		this.postsquant.innerHTML = this.lpost['postsquant'] + txt['postsquant'];
	},
	
	
	markActive: function(){
		if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
		addClass(this.item, 'activetopic');
		//this.item.scrollIntoView(false); // снизу
	},
	
	
	bump: function(){
		var container = this.item.parentNode;
		var firstTopic = e('@topic', container);
		
		if (firstTopic != this.item){
			remove(this.item);
			insBefore(firstTopic, this.item);
		}
	},
	
	
	// цепляем к ним действия
	attachActions: function(){
		TopicItem.superclass.prototype.attachActions.apply(this, arguments);
		var that = this;
		
		// вешаем на клик событие загрузки сообщений
		var clickload = function(){
			wait.stop();
			wait.loadTopic(that.row['id']); //fillPosts(that.row['id'], e('@contents', '#viewport_posts'));
		}

		this.item.onclick = clickload;
		
		this.topicedit_btn.onmouseover = function(){
			that.item.onclick = null;
		}

		this.topicedit_btn.onmouseout = function(){
			if (!hasClass(that.topicfield, 'edittopicname')) that.item.onclick = clickload;
		}

		var cancelNameEdit = function(){
			hide(that.topicsubmit_btn, that.topiccancel_btn);
			unhide(that.topicedit_btn);
			that.topicfield.contentEditable = false;
			removeClass(that.topicfield, 'edittopicname');
			that.topicfield.ondblclick = editTopicName;
			that.item.onclick = clickload;
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
	
	
	createElems: function(){
		PostItem.superclass.prototype.createElems.apply(this, arguments);
		
		this.item.id = 'post_'+this.row['id'];
		addClass(this.item, 'post');
		
		// вешаем маркер непрочитанности
		if (maxReadPost && maxReadPost < sql2stamp(this.row['modified'] || this.row['created']))
			addClass(this.item, 'unread');

		// вешаем ID на контейнер сообщения для возможности прикрепления визивига
		this.message.id = 'message_'+this.row['id'];

		this.avatar	= div('avatar', null, '<img src="'+this.row['avatar_url']+'">');
	},
	
	fillData: function(){
		PostItem.superclass.prototype.fillData.apply(this, arguments);
	},
	
	attachActions: function(){
		PostItem.superclass.prototype.attachActions.apply(this, arguments);
		var that = this;
		
		this.item.onclick = function(){
			adress.set('message', that.row['id']);
		}
		
		// Редактирование сообщения
		var editMessage = function(){

			// AJAX:
			JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

				  action: 'check'
				, id: that.row['id']

			}, function(result, errors) {if (result['locked'] == null){ // что делаем, когда пришел ответ:

				wait.stop();

				var req = new JsHttpRequest();
				req.open(null, 'ajax_backend.php', true);
				req.send({action: 'lock_post', id: that.row['id']});

				var backupMsg = that.message.innerHTML;

				// создаем визивиг и элементы управления
				var editor = veditor();
				hide(that.infobar, that.controls);
				editor.panelInstance(that.message.id);
				e('@nicEdit-panel', that.item).style.paddingLeft = '47px';
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
				that.item.appendChild(editControls);
				appendKids(editControls, cancelBtn, sendBtn, nuclear());

			} else alert(txt['post_locked']);}, true ); // запрещать кеширование
		}
		
		// Удаление сообщения
		var deleteMessage = function(){

			JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

				  action: 'check'
				, id: that.row['id']

			}, function(result, errors) {if (result['locked'] == null){ // когда пришел ответ:

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
						if (hasClass(that.item, 'lastblock') && prevElem(that.item)){
							addClass(prevElem(that.item), 'lastblock');
						}
						remove(that.item);

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

			} else alert (txt['post_locked']);}, true /* запрещать кеширование */ );
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

			insAfter(that.item, answerBlock);
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
								newBlock = newBlock.item;
									
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
								insAfter(that.item, newBranch.cont);
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
		var elem = messages[row['id']] = new PostItem(row, contArea, topicID, that);
		
		return elem.item;
	}
	
	this.appendBlock = function(row){
		var block = that.createBlock(row);
		that.cont.appendChild(block);
		addClass(block, 'lastblock');
		if (prevElem(block)) removeClass(prevElem(block), 'lastblock');
		return block;
	}
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




function Updater(){
	var that = this;
	
	this.started = false;
	
	this.topicSort = 'updated';
	this.tsReverse = true;
	
	var req = false;
	
	var vpPosts  = e('#viewport_posts');
	var vpTopics = e('#viewport_topics');
	
	var postsCont =	 e('@contents'  , vpPosts);
	var pSbar =		 e('@statusbar' , vpPosts);
	var pTbar =		 e('@titlebar'  , vpPosts);
	var topicsCont = e('@contents'  , vpTopics);
	var tSbar =		 e('@statusbar' , vpTopics);
	var tTbar =		 e('@titlebar'  , vpTopics);
	var SInd =		 e('@state_ind' ,'#top_bar');
	
	// ФУНКЦИЯ ЦИКЛИЧНОГО ОЖИДАНИЯ
	this.start = function(maxdateTS, forced, loadTopic){
		if (!that.started || forced){
			
			// устанавливаем флаг, блокирующий параллельный старт еще одного запроса
			that.started = true;
			
			// забиваем начальную дату в свойство (на всякий случай !! возможно потом убрать)
			that.maxdateTS = maxdateTS;
			
			addClass(SInd, 'updating'); // индикация ожидания вкл
			
			// Отправляем запрос
			req = new JsHttpRequest();
			req.onreadystatechange = function() {if (req.readyState == 4) {
				
				// разбираем пришедший пакет и выполняем обновления
				that.maxdateTS = parseResult(req.responseJS);
				
				removeClass(SInd, 'updating'); // индикация ожидания откл
				
				// Рекурсия (forced (true) - только при рестарте ожидалки)
				setTimeout(function(){that.start(that.maxdateTS, true)}, 500);
				
			}}
			req.open(null, 'ajax_backend.php', true);
			req.send({
				action: 'load_updates',
				maxdateTS: that.maxdateTS,
				curTopic: currentTopic,
				topicSort: that.topicSort,
				tsReverse: that.tsReverse,
				loadTopic: loadTopic ? loadTopic : null
			});
		}
	}
	
	// остановщик ожидателя long-poll
	this.stop = function(){
		if (that.started && req){
			
			// переопределяем, иначе wait рестартует, воспринимая аборт как полноценное завершение запроса
			req.onreadystatechange = function() {

				var stopWait = new JsHttpRequest();
				stopWait.open(null, 'ajax_light_backend.php', true);
				stopWait.send({
					  action: 'stop_waiting'
					, file: getCookie('PHPSESSID')+'-'+req._ldObj.id
				});
				
				removeClass(SInd, 'updating');
			}
			req.abort();
			that.started = false;
		}
	}
	
	// обертка для загрузки выбранной темы
	this.loadTopic = function(topic){
		
		// чистим всё
		postsCont.innerHTML = '';
		branches = {};
		messages = {};
		
		// запрашиваем новую тему
		currentTopic = topic;
		that.start(that.maxdateTS, null, true);
		
		// хеш-строка адреса
		adress.set('topic', topic);
		adress.del('message');
	}
	
	// забронируем
	this.timeout = function(){}
	
	// РАЗБОР ПАКЕТА И ВЫПОЛНЕНИЕ ОБНОВЛЕНИЙ
	var parseResult = function(result){
		
		// разбираем темы
		if (result && result['topics']){
			
			for (var i in result['topics']) { var entry = result['topics'][i];
				
				if (topics[entry['id']]){ // если в текущем массиве загруженных тем такая уже есть
					
					if (entry['deleted']){
						remove(topics[entry['id']].item);
						delete(topics[entry['id']]);
					} else {
						topics[entry['id']].fillData(entry);
						topics[entry['id']].bump();
					}
					
				} else if (!entry['deleted']) { // если в текущем массиве тем такой нет и пришедшая не удалена
					
					topics[entry['id']] = new TopicItem(entry);
					topicsCont.appendChild(topics[entry['id']].item);
				}	
			}
		}

		
		// разбираем последние посты
		if (result && result['lastposts']){
			for (var i in result['lastposts']) { var entry = result['lastposts'][i];
				
				var topic = topics[entry['topic_id']];
				
				if (topic) {
					topic.fillLast(entry);
					topic.bump();
				}
			}
		}
		
		
		// разбираем сообщения
		if (result && result['posts']){
			
			var tProps = result['topic_prop'];
			
			pTbar.innerHTML = tProps['name'];
			
			for (var i in result['posts']) { var entry = result['posts'][i];
								
				if (messages[entry['id']]){ // если в текущем массиве загруженных сообщений такое уже есть
					
					if (entry['deleted']){
						remove(messages[entry['id']].item);
						delete(messages[entry['id']]);
					} else messages[entry['id']].fillData(entry);
					
				} else if (!entry['deleted']) { // если в текущем массиве такого нет и пришедшее не удалено
					
					// !! не учитывается ветвление!
					// один из вариантов решения - хранить в базе в поле msg_parent id самого 
					// сообщения, если сообщение заглавное в ветке (т.е. если раньше там было 0)
					// тогда var parent = entry['parent']
					var parent = currentTopic;
					
					// если такой ветки еще нет - создаем 
					if (!branches[parent]) branches[parent] = new Branch(postsCont, currentTopic, parent);
					
					// добавляем новое сообщение к существующей (или новосозданной) ветке
					branches[parent].appendBlock(entry);
				}
			}
			
			// наличие id означает что тема загружается полностью
			if (tProps['id']) {
				topics[tProps['id']].markActive(); // делаем тему в столбце тем активной
				
				// управляем автопрокруткой
				var refPost;
				if ((refPost = adress.get('message'))){
					
					messages[refPost].item.scrollIntoView(false);
					
				} else if (tProps['date_read'] != 'firstRead') {
					
					messages[entry['id']].item.scrollIntoView(false);
				}
			}
		}
		
		// Выдать новый TS полученный из пакета обновлений
		return sql2stamp(result['new_maxdate']);
	}
}


function startEngine(){
	wait = new Updater;
	
	/* //fillTopics();
	if ((currentTopic = adress.get('topic'))){
		//branches = {}; fillPosts(currentTopic, e('@contents', '#viewport_posts'));
	} */
   
	currentTopic = adress.get('topic');
	wait.start(0);
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