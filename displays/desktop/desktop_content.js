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
		
		this.lastpost = div('lastpost' /*, 'lastpost_'+this.row['last_id']*/);
	},
	
	
	// заполняем их данными
	fillData: function(){
		TopicItem.superclass.prototype.fillData.apply(this, arguments);
		
		if (this.row['lastpost']) this.lastpost.innerHTML =  '<div>'+txt['lastpost']+' <span class="author">'
			+this.row['lastauthor']+'</span>' + ' ['+this.row['lastdate']+'] ' + this.row['lastpost']+'</div>';
		
		
		this.postsquant.innerHTML = ((this.row['postsquant']*1)+1) + txt['postsquant'];
		this.topicfield.innerHTML = this.row['topic_name'] ? this.row['topic_name'] : '&nbsp;';
		this.debug.innerHTML = this.row['totalmaxd'];
	},
	
	
	// альтернативная вариация lastpost, когда он подается в отдельном массиве
	/*
	fillLast: function(lpost){
		
		this.lpost = lpost;
		
		if (!this.lastpost){
			this.lastpost = div('lastpost', 'lastpost_'+this.lpost['id']);
			insAfter(this.message, this.lastpost);
		}
		
		this.lastpost.innerHTML =  txt['lastpost']+' <span class="author">'+this.lpost['author']
				+'</span>' + ' ['+this.lpost['created']+'] ' + this.lpost['message'];
			
		this.postsquant.innerHTML = this.lpost['postsquant'] + txt['postsquant'];
	},*/
	
	// отметка темы активной (текущей)
	markActive: function(){
		if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic'); // убираем предыдущую активную
		addClass(this.item, 'activetopic');
		//this.item.scrollIntoView(false); // снизу
	},
	
	// подъем темы наверх
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
		
			// чистим всё
			e('@contents', '#viewport_posts').innerHTML = '';
			branches = {};
			messages = {};

			// запрашиваем новую тему
			currentTopic = that.row['id'];
			wait.start(1, 'load_topic');

			// хеш-строка адреса
			adress.set('topic', that.row['id']);
			adress.del('message');
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
		
		var submitTopicName = function(){
			cancelNameEdit();

			wait.stop();
			wait.writeAndStart('update', {id: that.row['id'], topic_name: that.topicfield.innerHTML});
		}

		// функция инлайн-редактирования темы
		var editTopicName = function(){
			
			JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

				action: 'check_n_lock',
				id: that.row['id']

			}, function(result, errors) {

				if (result['locked'] !== null) {

						alert(txt['post_locked']);

				} else {
					
					hide(that.topicedit_btn);
			
					that.topicfield.ondblclick = null;
					that.topicfield.contentEditable = true;
					var text = that.topicfield.innerHTML;
					that.topicfield.focus();
					addClass(that.topicfield, 'edittopicname');
					
					unhide(that.topicsubmit_btn, that.topiccancel_btn);
					
					that.topicsubmit_btn.onclick = submitTopicName;
					that.topiccancel_btn.onclick = function() {
						cancelNameEdit();
						
						var req = new JsHttpRequest();
						req.open(null, 'ajax_backend.php', true);
						req.send({
							action: 'unlock_post'
							, id: that.row['id']
						});
					}
				}
			}, true); //запр. кеш
			
			/*
			document.onkeypress = function(event){
				var key = event.keyCode || event.which;
				if (key == 13){
					submitTopicName();
					document.onkeypress = null;
				} // on enter
			}
			*/
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
	
	
	createElems: function() {
		PostItem.superclass.prototype.createElems.apply(this, arguments);
		
		this.item.id = 'post_'+this.row['id'];
		addClass(this.item, 'post');
		
		// вешаем маркер непрочитанности
		/*
		if (maxReadPost && maxReadPost < sql2stamp(this.row['modified'] || this.row['created']))
			addClass(this.item, 'unread');
		*/
	   
		// вешаем ID на контейнер сообщения для возможности прикрепления визивига
		this.message.id = 'message_'+this.row['id'];

		this.avatar	= div('avatar', null, '<img src="'+this.row['avatar_url']+'">');
	},
	
	/*
	fillData: function(){
		PostItem.superclass.prototype.fillData.apply(this, arguments);
	},
	*/
   
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

				action: 'check_n_lock',
				id: that.row['id']

			}, function(result, errors) {
				
				if (result['locked'] !== null) {

						alert(txt['post_locked']);

				} else { // что делаем, когда пришел ответ:

					var backupMsg = that.message.innerHTML;

					// создаем визивиг и элементы управления
					hide(that.infobar, that.controls);

					var editor = veditor();
					editor.panelInstance(that.message.id);
					e('@nicEdit-panel', that.item).style.paddingLeft = '47px';
					that.message.focus();
					var editControls = div('controls');
					
					var cancelBtn = div('sbtn cancel', null, '<span>'+ txt['cancel'] +'</span>');
					var sendBtn = div('sbtn save', null, '<span>'+ txt['save'] +'</span>');
					
					// собираем конструктор
					that.item.appendChild(editControls);
					appendKids(editControls, 
						cancelBtn, 
						sendBtn, 
						nuclear()
					);
					
					// программируем кнопки
					var cancelEdit = function(){
						remove(editControls);
						editor.removeInstance(that.message.id);
						editor.removePanel(that.message.id);
						unhide(that.infobar, that.controls);
					}

					var updateMessage = function(){
						
						wait.stop();
						wait.writeAndStart('update', {id: that.row['id'], message: that.message.innerHTML});
						cancelEdit();
					}
					
					sendBtn.onclick = updateMessage;

					cancelBtn.onclick = function(){
						cancelEdit();
						that.message.innerHTML = backupMsg;

						var req = new JsHttpRequest();
						req.open(null, 'ajax_backend.php', true);
						req.send({
							action: 'unlock_post'
							, id: that.row['id']
						});
					}
				}
			}, true ); // запрещать кеширование
		}
		
		// Удаление сообщения
		var deleteMessage = function(){
			
			if (confirm(txt['msg_del_confirm'])){
				wait.stop();

				wait.writeAndStart( 'delete_post', { id: that.row['id'] });
			}
		}
		
		// добавляем кнопки
		//var branchBtn = addBtn('addbranch', txt['answer']);
		//branchBtn.onclick = function(){addMessage(branchBtn);}

		/* if (userID) {
			var plainBtn = this.addBtn('plainanswer', txt['answer']);
			plainBtn.onclick = function(){addMessage(plainBtn, 'plain');}
		} */

		if (this.row['author_id'] == userID){

			this.addBtn('editmessage').onclick = editMessage;
			this.message.ondblclick = editMessage;
			this.addBtn('deletemessage').onclick = deleteMessage;
		}
		
		//var collEx = this.addBtn('collex none');
		//collEx.onclick = function(){alert('collapse/expand ');}

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
		//addClass(block, 'lastblock');
		//if (prevElem(block)) removeClass(prevElem(block), 'lastblock');
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


function Updater(parseFunc){
	var that = this;
	
	this.startBlocked = false;
	this.maxdateTS = 0;
	
	this.topicSort = 'updated';
	this.tsReverse = true;
	
	var req = false;
	
	var SInd = e('@state_ind' ,'#top_bar');
	
	// ФУНКЦИЯ ЦИКЛИЧНОГО ОЖИДАНИЯ
	this.start = function(forceDateTS, subAction, params){
		if (!that.startBlocked || forceDateTS){
			
			// устанавливаем флаг, блокирующий параллельный старт еще одного запроса
			that.startBlocked = true;
			
			// если не нужно менять дату (только форсировать старт) то на вход функции можно подать 1
			if (forceDateTS && forceDateTS !== 1) that.maxdateTS = forceDateTS;
			
			addClass(SInd, 'updating'); // индикация ожидания вкл
			
			// Отправляем запрос
			req = new JsHttpRequest();
			req.onreadystatechange = function() {if (req.readyState == 4) {
				that.startBlocked = false;
				
				// разбираем пришедший пакет и выполняем обновления
				that.maxdateTS = parseFunc(req.responseJS);
				
				removeClass(SInd, 'updating'); // индикация ожидания откл
				
				setTimeout(function(){that.start()}, 500);
				
			}}
			req.open(null, 'ajax_backend.php', true);
			req.send({
				action: 'load_updates',
				maxdateTS: that.maxdateTS,
				curTopic: currentTopic,
				topicSort: that.topicSort,
				tsReverse: that.tsReverse,
				subAction: subAction ? subAction : null,
				params: params ? params : null
			});
		}
	}
	
	this.writeAndStart = function(subAction, params){
		
		// внезапный финт ушами: все записи и обновления базы делаются одним запросом с чтением
		that.start(1, subAction, params);
	}
	
	// остановщик ожидателя long-poll
	this.stop = function(){
		if (that.startBlocked && req){
			
			// переопределяем, иначе wait воспринимает экстренную остановку как полноценное завершение запроса
			req.onreadystatechange = function() {

				JsHttpRequest.query( 'ajax_light_backend.php', {
					  action: 'stop_waiting'
					, file: getCookie('PHPSESSID')+'-'+req._ldObj.id
				}, function(){}, true );
				
				removeClass(SInd, 'updating');
			}
			req.abort();
			that.startBlocked = false;
		} else { // если стоп вызывается когда this.startBlocked == false, значит это произошло между запусками
			// это заблокирует старт и он станет возможен только при помощи форсированного запуска с датой
			that.startBlocked = true;
		}
	}
	
	// забронируем
	this.timeout = function(){}
}


// РАЗБОР ПАКЕТА И ВЫПОЛНЕНИЕ ОБНОВЛЕНИЙ
function parseResult(result){
	
	var entry, topic, message;

	var vpPosts  = e('#viewport_posts');
	var vpTopics = e('#viewport_topics');
	
	var postsCont =	 e('@contents'  , vpPosts);
	var pSbar =		 e('@statusbar' , vpPosts);
	var pTbar =		 e('@titlebar'  , vpPosts);
	var topicsCont = e('@contents'  , vpTopics);
	var tSbar =		 e('@statusbar' , vpTopics);
	var tTbar =		 e('@titlebar'  , vpTopics);
	
	if (result && result['error']) alert(txt['post_locked']);

	// разбираем темы
	if (result && result['topics']) { for (var i in result['topics']) { 
		entry = result['topics'][i];
		topic = topics[entry['id']];

		if (topic){ // если в текущем массиве загруженных тем такая уже есть

			if (entry['deleted']){
				remove(topic.item);
				delete(topics[entry['id']]);
			} else {
				topic.fillData(entry);
				topic.bump();
			}

		} else if (!entry['deleted']) { // если в текущем массиве тем такой нет и пришедшая не удалена

			topics[entry['id']] = new TopicItem(entry);
			topicsCont.appendChild(topics[entry['id']].item);
		}	
	}}


	// разбираем последние посты
	/*
	if (result && result['lastposts']) { for (var i in result['lastposts']) { 
		entry = result['lastposts'][i];
		topic = topics[entry['topic_id']];

		if (topic) {
			topic.fillLast(entry);
			topic.bump();
		}
	}}
	*/


	// разбираем сообщения
	if (result && result['posts']){

		var tProps = result['topic_prop'];

		pTbar.innerHTML = tProps['name'];

		for (var i in result['posts']) { 
			entry = result['posts'][i];
			message = messages[entry['id']];

			if (message){ // если в текущем массиве загруженных сообщений такое уже есть

				if (entry['deleted']){
					shownRemove(message.item);
					delete(messages[entry['id']]);
				} else message.fillData(entry);

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

				var lastvisible = messages[entry['id']];
			}
		}
		
		if (tProps['scrollto']) messages[tProps['scrollto']].item.scrollIntoView(false);

		// наличие id означает что тема загружается полностью
		if (tProps['id']) {
			topics[tProps['id']].markActive(); // делаем тему в столбце тем активной

			// если тема загружается не вручную кликом по ней - промотать до неё в списке
			if (!tProps['manual']) topics[tProps['id']].item.scrollIntoView(false);

			// управляем автопрокруткой
			var refPost = adress.get('message');
			if (messages[refPost]){

				messages[refPost].item.scrollIntoView(false);

			} else if (tProps['date_read'] != 'firstRead') {
				// !! тут будет прокрутка до первого непрочитанного поста
				lastvisible.item.scrollIntoView(false);
			}
		}
	}

	// Выдать новый TS полученный из пакета обновлений
	return sql2stamp(result['new_maxdate']);
}




// функция добавления сообщения набросана как попало! разобраться!
function insertTypeforms(){
	var container = e('@typing_panel', '#viewport_posts');
	
	var form = newel('form', null, 'answer_here');
	var textarea = newel('textarea', null, 'textarea_0');
		textarea.rows = 1;
	var controls = div('controls');
	//var cancel = div('button', 'cancel_post', '<span>'+txt['cancel']+'</span>');
	var send = div('button', 'send_post', '<span>'+txt['send']+'</span>');
	
	form.appendChild(textarea);
	
	appendKids( container
		, form
		, controls
	);
		
	appendKids( controls
		//, cancel
		, send
		, nuclear()
	);
		
	var editor = veditor();
	editor.panelInstance(textarea.id);
	var field = e('@nicEdit-main', form);
	field.parentNode.className = 'nicEdit-wrapper';
	//field.style.overflow = 'auto';
	
	setTimeout(function(){field.focus();}, 500);
	
	
	var pSbar = e('@statusbar', '#viewport_posts');
	var areaHeight = field.offsetHeight;
	pSbar.innerHTML = areaHeight;
	
	resizeContArea(e('#viewport_posts'));
	
	field.onkeyup = function(){
		pSbar.innerHTML = field.offsetHeight;
		
		if (areaHeight != field.offsetHeight){
			resizeContArea(e('#viewport_posts'));
			areaHeight = field.offsetHeight;
		}
	}
	
	send.onclick = function(){
		
		wait.stop();
		
		wait.writeAndStart( 'insert_post' , {
			message: field.innerHTML
		});
		
		field.innerHTML = '';
	}
}


function startEngine(){
	insertTypeforms();
	
	wait = new Updater(parseResult);
   
	currentTopic = adress.get('topic');
	wait.start();
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