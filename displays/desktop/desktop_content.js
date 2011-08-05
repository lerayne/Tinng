// Глобальные переменные
var currentTopic = 0;
var branches = {};
var topics = {};
var messages = {};
var baloon = false;

function clearBaloon(){
	if (baloon) {remove(baloon);baloon = false;}
}

function clearOverlay(){
	clearBaloon();
	
	var ovls = e('.overlay', null, true);
	
	for (var i in ovls) hide(ovls[i]);
}


function Tag(entry){
	
	var tag = div('tag '+entry['type'], null, entry['name']);
	//message.tags.appendChild(tag);
	
	tag.onclick = function(e){
		
		clearBaloon();
		
		baloon = div('baloon');
		var intag = div('intag '+entry['type'], null, entry['name']);
		var bal_cont = div('cont');
		var close = div('right', null, '_');
		
		tag.appendChild(baloon);
		baloon.appendChild(intag);
		baloon.appendChild(bal_cont);
		intag.appendChild(close);
		
		baloon.onclick = function(e){stopBubble(e)};
		close.onclick = clearBaloon;
		
		
		if (entry.type != 'strict'){
			var del = div('sbtn left btn_deltag');
			
			del.onclick = function(){
				clearBaloon();
				
				wait.start('tag_remove', {msg: entry.message, tag: entry.id});
			}
		}
		
		appendKids( bal_cont,
			del,
			nuclear()
		);
		
		stopBubble(e);
	}
	
	return tag;
}

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


function unloadTopic() {
	// чистим всё
	e('@contents', '#viewport_posts').innerHTML = '';
	branches = {};
	messages = {};
	currentTopic = 0;
}

function loadTopic(id) {
	
	answerForm.titleOff();
	currentTopic = id;
	wait.start('load_topic');

	// хеш-строка адреса
	adress.set('topic', id);
	adress.del('message');
}

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
	},
	
	fillData: function() {
		DesktopMessageItem.superclass.prototype.fillData.apply(this, arguments);
		
		// пометка сообщения непрочитанным
		if (this.row['unread'] == '1') addClass(this.item, 'unread');
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
		
		if (this.row['tags']) {
			this.tags.innerHTML = '';
			for (var i in this.row['tags']) this.tags.appendChild(new Tag(this.row['tags'][i]));
		}
		
		this.postsquant.innerHTML = ((this.row['postsquant']*1)+1) + txt['postsquant'];
		this.topicfield.innerHTML = this.row['topic_name'] ? this.row['topic_name'] : '&nbsp;';
		this.debug.innerHTML = this.row['totalmaxd'];
	},
	
	unmarkActive: function(){
		if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
	},
	
	// отметка темы активной (текущей)
	markActive: function(){
		this.unmarkActive(); // убираем предыдущую активную
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
			unloadTopic();
			loadTopic(that.row['id']);
		}

		this.item.onclick = clickload;

		var cancelNameEdit = function(e){
			hide(that.topicsubmit_btn, that.topiccancel_btn);
			unhide(that.topicedit_btn);
			
			that.topicfield.contentEditable = false;
			removeClass(that.topicfield, 'edittopicname');
			that.topicfield.ondblclick = editTopicName;
			that.item.onclick = clickload;
	
			that.topicfield.onclick = null;
	
			stopBubble(e);
		}
		
		var submitTopicName = function(e){
			cancelNameEdit();

			wait.start('update', {id: that.row['id'], topic_name: that.topicfield.innerHTML});
			
			stopBubble(e);
		}

		// функция инлайн-редактирования темы
		var editTopicName = function(e){
			
			that.topicfield.onclick = function(e){stopBubble(e)};
			
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
			
			stopBubble(e);
			
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
	   
		// вешаем ID на контейнер сообщения для возможности прикрепления визивига
		this.message.id = 'message_'+this.row['id'];

		this.avatar	= div('avatar', null, '<img src="'+this.row['avatar_url']+'">');
	},
	
	
	fillData: function(){
		PostItem.superclass.prototype.fillData.apply(this, arguments);
		
		if (this.row['topicstarter'] == this.row['author_id']) 
			this.msgid.innerHTML = '&nbsp;('+txt['topicstarter']+')'+this.msgid.innerHTML;
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
						
						wait.start('update', {id: that.row['id'], message: that.message.innerHTML});
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
				wait.start( 'delete_post', {id: that.row['id']});
			}
		}
		
		// добавляем кнопки
		//var branchBtn = addBtn('addbranch', txt['answer']);
		//branchBtn.onclick = function(){addMessage(branchBtn);}

		/* if (userID) {
			var plainBtn = this.addBtn('plainanswer', txt['answer']);
			plainBtn.onclick = function(){addMessage(plainBtn, 'plain');}
		} */

		if (this.row['author_id'] == userID || userID == '1'){

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


function Branch (contArea, topicID, parentID){
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
	
	if (topics[currentTopic]) topics[currentTopic].unmarkActive();
	unloadTopic();
	
	e('@titlebar', '#viewport_posts').innerHTML = txt['new_topic'];
	
	answerForm.titleOn();
}


function Updater(parseFunc){
	var that = this;
	
	this.startBlocked = false;
	this.maxdateTS = 0;
	
	// сортировка по умолчанию
	this.topicSort = 'updated';
	this.tsReverse = true;
	
	var req = false;
	var timeout = false;
	
	var SInd = e('@state_ind' ,'#top_bar');
	
	// ФУНКЦИЯ ЦИКЛИЧНОГО ОЖИДАНИЯ
	this.start = function(subAction, params){
		
		consoleWrite('Launching query',1);
		
		if (that.startBlocked || timeout) that.stop();

		// устанавливаем флаг, блокирующий параллельный старт еще одного запроса
		that.startBlocked = true;

		that.startIndication(); // индикация ожидания вкл

		// Отправляем запрос
		req = new JsHttpRequest();
		req.onreadystatechange = function() {if (req.readyState == 4) {
			
			// разбираем пришедший пакет и выполняем обновления
			that.maxdateTS = parseFunc(req.responseJS);

			that.stopIndication(); // индикация ожидания откл

			that.startBlocked = false;

			timeout = setTimeout(function(){that.start()}, cfg['poll_timer']);

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
	
	// как-то отмечаем в интерфейсе что запрос ушел
	this.startIndication = function(){
		addClass(SInd, 'updating');
	}
	
	// как-то отмечаем в интерфейсе что запрос закончен
	this.stopIndication = function(){
		removeClass(SInd, 'updating');
	}
	
	// функция, выполняющаяся при отмене уже поданного запроса
	this.doOnAbort = function() {
		that.stopIndication();
	}
	
	// остановщик ожидателя poll
	this.stop = function(){
		
		timeout = advClearTimeout(timeout);
		
		if (that.startBlocked) {
			// переопределяем, иначе wait воспринимает экстренную остановку как полноценное завершение запроса
			req.onreadystatechange = that.doOnAbort;
			req.abort();
			req = 0;

			that.startBlocked = false;

			consoleWrite('STOP occured while WAITING. Query has been ABORTED');
		
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

	var tProps = (result && result['topic_prop']) ? result['topic_prop'] : [];

	// разбираем темы
	if (result && result['topics']) {for (var i in result['topics']) { 
		entry = result['topics'][i];
		
		// если в текущем массиве загруженных тем такая уже есть - обновляем существующую
		if (topics[entry['id']]){
			topic = topics[entry['id']];
			
			if (entry['deleted']){
				
				shownRemove(topic.item);
				if (entry['id'] == currentTopic) unloadTopic();
				delete(topics[entry['id']]);
				
			} else {
				topic.fillData(entry);
				topic.bump();
			}
		
		// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
		} else if (!entry['deleted']) {

			topics[entry['id']] = new TopicItem(entry);
			topicsCont.appendChild(topics[entry['id']].item);
			if (tProps['new']) loadTopic(entry['id']);
		}	
	}}


	// разбираем сообщения
	if (result && result['posts']){

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
	
	
	// добавляем теги
	if (result && result['tags']){
		
		for (var i in result['tags']) {
		
			entry = result['tags'][i];

			if (topics[entry['message']]) addTag(topics[entry['message']], entry);
		}
	}


	// Выдать новый TS полученный из пакета обновлений
	return sql2stamp(result['new_maxdate']);
}


function AnswerForm(container){
	var that = this;
	
	this.container = container;
	
	this.form = newel('form', null, 'answer_here');
	this.title = newel('input', 'topic_name none');
	this.message = newel('textarea', null, 'textarea_0');
	this.controls = div('controls');
	this.cancel = div('button none', 'cancel_post', '<span>'+txt['cancel']+'</span>');
	this.send = div('button', 'send_post', '<span>'+txt['send']+'</span>');
	
	this.message.rows = 1;
	this.title.name = 'topic';
	this.title.type = 'text';
	
	appendKids( this.form
		, this.title
		, this.message
	);
	
	appendKids( this.container
		, this.form
		, this.controls
	);
		
	appendKids( this.controls
		, this.cancel
		, this.send
		, nuclear()
	);
		
	var editor = veditor();
	editor.panelInstance(this.message.id);
	
	this.field = e('@nicEdit-main', this.form);
	this.field.parentNode.className = 'nicEdit-wrapper';
	
	setTimeout(function(){that.field.focus()}, 500);
	
	
	var pSbar = e('@statusbar', '#viewport_posts');
	var areaHeight = this.field.offsetHeight;
	pSbar.innerHTML = areaHeight;
	
	var resize = function() {
		resizeContArea(e('#viewport_posts'));
	}
	
	resize();
	
	this.field.onkeyup = function(){
		pSbar.innerHTML = that.field.offsetHeight;
		
		if (areaHeight != that.field.offsetHeight){
			resize();
			areaHeight = that.field.offsetHeight;
		}
	}
	
	this.send.onclick = function(){
		
		wait.start( 'add_topic' , {
			message: that.field.innerHTML,
			title: that.title.value
		});
		
		that.field.innerHTML = '';
	}
	
	this.titleOn = function() {
		unhide(that.title);
		resize();
	}
	
	this.titleOff = function(){
		that.title.value = '';
		hide(that.title);
		resize();
	}
}


function startEngine(){
	answerForm = new AnswerForm(e('@typing_panel', '#viewport_posts'));
	
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