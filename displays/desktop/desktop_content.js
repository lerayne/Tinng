// Глобальные переменные
var currentTopic = 0;
var postsPageLimit = 1;
var pglimit_date = 0;
var selectedPost;
var branches = [];
var topics = [];
var messages = [];
var baloon = false;

function grandTest() {
	consoleWrite('Limit Date = '+pglimit_date);
}

function getID(elem){
	return (elem.nodeType == 1) ? parseInt(elem.id.split('_')[1]) : null;
}

function clearBaloon(){
	if (baloon) {
		remove(baloon);
		baloon = false;
	}
}

function clearOverlay(){
	clearBaloon();
	
	var ovls = e('.overlay', null, true);
	
	for (var i in ovls) hide(ovls[i]);
}


function Tag(entry){
	
	var tag = div('tag tag_'+entry.type, null, entry.name);
	//message.tags.appendChild(tag);
	
	tag.onclick = function(e){
		
		clearBaloon();
		
		baloon = div('baloon');
		var intag = div('intag tag_'+entry.type, null, entry.name);
		var bal_cont = div('cont');
		var close = div('right', null, '_');
		
		tag.appendChild( baloon );
		baloon.appendChild( intag );
		baloon.appendChild( bal_cont );
		intag.appendChild( close );
		
		baloon.onclick = function(e){stopBubble(e)};
		close.onclick = clearBaloon;
		
		
		if (entry.type != 'strict'){
			var del = div('sbtn left btn_deltag');
			
			del.onclick = function(){
				clearBaloon();
				
				rotor.start('tag_remove', {msg: entry.message, tag: entry.id});
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
	postsPageLimit = 1;
	pglimit_date = 0;
	postSelect(false);
}

function loadTopic(id) {
	
	answerForm.topicModeOff();
	currentTopic = id;
	rotor.start('load_pages');

	// хеш-строка адреса
	adress.set('topic', id);
	adress.set('plimit', postsPageLimit);
	adress.del('message');
}

function postSelect(id){
	var current = e('@selected', '#viewport_posts');
	if (current){
		// если мы клацнули по уже выделенному посту - ничего не делаем, выходим из функции
		if (current.id == 'post_'+id) return;
		// иначе снимаем выделение с текущего и идем дальше
		removeClass(current, 'selected');
	}
	
	/*if (selectedPost && answerForm.field.innerHTML == selectedPost.row.author+', ') 
		answerForm.field.innerHTML = '<br>';*/
	
	// передача строго false в качестве параметра просто снимает старое выделение, но не назначает новое
	if (id === false) {
		selectedPost = false;
		//answerForm.hideAdvice();
		adress.del('message');
		return; 
	}
	
	var newone = e('#post_'+id, '#viewport_posts');

	if (!newone) {
		//adress.set('plimit', postsPageLimit++);
		rotor.start('next_page', {directMsg: id});
		newone = e('#post_'+id, '#viewport_posts');
	}
	
	if (newone) {
		//console.warn(id);
		addClass(newone, 'selected');
		selectedPost = messages[id];
		//answerForm.showAdvice(id);
		//if (answerForm.field.innerHTML == '<br>') answerForm.field.innerHTML = selectedPost.row.author+', ';
	} else {
		selectedPost = false; // на случай, если передан несуществующий новый id
		//answerForm.hideAdvice();
	}
	return;
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
		if (this.row.unread == '1') addClass(this.item, 'unread');
	}
});


// класс элемента темы
var TopicItem = Class( DesktopMessageItem, {
	
	
	// добавляем элементы
	createElems: function(){
		TopicItem.superclass.prototype.createElems.apply(this, arguments);
		
		this.item.id = 'topic_'+this.row.id;
		addClass(this.item, 'topic');
		
		if (this.row.last && this.row.last.message)
			this.lastpost = div('lastpost', 'lastpost_'+this.row.last.id);

		this.postsquant = div('postsquant reveal');

		// создаем элемент "тема"
		this.topicname = div('topicname editabletopic revealer2');
		this.topicfield = div('left');
		this.topicedit_btn = div('sbtn btn_topicedit right reveal2');
		this.topicsubmit_btn = div('sbtn btn_topicsubmit right none');
		this.topiccancel_btn = div('sbtn btn_topiccancel right none');
		
		this.lastpost = div('lastpost' /*, 'lastpost_'+this.row.last_id*/);
	},
	
	
	// заполняем их данными
	fillData: function(){
		TopicItem.superclass.prototype.fillData.apply(this, arguments);
		
		if (this.row.lastpost) this.lastpost.innerHTML =  '<div>' + txt.lastpost + ' <span class="author">'
			+ this.row.lastauthor + '</span>' + ' [' + this.row.lastdate + '] ' + this.row.lastpost + '</div>';
		
		if (this.row.tags) {
			this.tags.innerHTML = '';
			for (var i in this.row.tags) this.tags.appendChild(new Tag(this.row.tags[i]));
		}
		
		this.postsquant.innerHTML = ((this.row.postsquant*1)+1) + txt.postsquant;
		this.topicfield.innerHTML = this.row.topic_name ? this.row.topic_name : '&nbsp;';
		this.debug.innerHTML = this.row.totalmaxd;
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
			loadTopic(that.row.id);
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

			rotor.start('update_message', {id: that.row.id, topic_name: that.topicfield.innerHTML});
			
			stopBubble(e);
		}

		// функция инлайн-редактирования темы
		var editTopicName = function(e){
			
			that.topicfield.onclick = function(e){stopBubble(e)};
			
			JsHttpRequest.query( 'backend/service.php', { // аргументы:

				action: 'check_n_lock',
				id: that.row.id

			}, function(result, errors) {

				if (result.locked !== null) {

						alert(txt.post_locked);

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
						req.open(null, 'backend/service.php', true);
						req.send({
							action: 'unlock_message'
							, id: that.row.id
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
		if (this.row.author_id == userID) {
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
		
		this.item.id = 'post_'+this.row.id;
		addClass(this.item, 'post');
	   
		// вешаем ID на контейнер сообщения для возможности прикрепления визивига
		this.message.id = 'message_'+this.row.id;

		this.avatar	= div('avatar', null, '<img src="'+this.row.avatar_url+'">');
		
		if (this.row.parent_id != this.row.topic_id){
			this.parent_link.innerHTML = txt.show_parent;
			this.parent.appendChild(this.parent_link);
		}
	},
	
	
	fillData: function(){
		PostItem.superclass.prototype.fillData.apply(this, arguments);
		
		if (this.row.topicstarter == this.row.author_id) 
			this.msgid.innerHTML = '&nbsp;('+txt.topicstarter+')'+this.msgid.innerHTML;
	},
	
   
	attachActions: function(){
		PostItem.superclass.prototype.attachActions.apply(this, arguments);
		var that = this;
		
		this.item.onclick = function(){
			adress.set('message', that.row.id);
			postSelect(that.row.id);
		}
		
		this.parent_link.onclick = function(evt) {
			messages[that.row.parent_id].item.scrollIntoView(true);
			postSelect(that.row.parent_id);
			stopBubble(evt);
		}
		
		// Редактирование сообщения
		var editMessage = function(evt){

			// AJAX:
			JsHttpRequest.query( 'backend/service.php', { // аргументы:

				action: 'check_n_lock',
				id: that.row.id

			}, function(result, errors) {
				
				if (result.locked !== null) {

						alert(txt.post_locked);

				} else { // что делаем, когда пришел ответ:

					var backupMsg = that.message.innerHTML;

					// создаем визивиг и элементы управления
					hide(that.infobar, that.controls);

					var editor = veditor();
					editor.panelInstance(that.message.id);
					e('@nicEdit-panel', that.item).style.paddingLeft = '47px';
					that.message.focus();
					var editControls = div('controls');
					
					var cancelBtn = div('sbtn cancel', null, '<span>'+ txt.cancel +'</span>');
					var sendBtn = div('sbtn save', null, '<span>'+ txt.save +'</span>');
					
					// собираем конструктор
					that.item.appendChild(editControls);
					appendKids(editControls, 
						cancelBtn, 
						sendBtn, 
						nuclear()
					);
					
					// программируем кнопки
					var cancelEdit = function(evt){
						remove(editControls);
						editor.removeInstance(that.message.id);
						editor.removePanel(that.message.id);
						unhide(that.infobar, that.controls);
						
						stopBubble(evt);
					}

					var updateMessage = function(evt){
						
						rotor.start('update_message', {id: that.row.id, message: that.message.innerHTML});
						cancelEdit();
						
						stopBubble(evt);
					}
					
					sendBtn.onclick = updateMessage;

					cancelBtn.onclick = function(evt){
						cancelEdit();
						that.message.innerHTML = backupMsg;

						var req = new JsHttpRequest();
						req.open(null, 'backend/service.php', true);
						req.send({
							action: 'unlock_message'
							, id: that.row.id
						});
						
						stopBubble(evt);
					}
				}
			}, true ); // запрещать кеширование
			
			stopBubble(evt);
		}
		
		// Удаление сообщения
		var deleteMessage = function(evt){
			
			if (confirm(txt.msg_del_confirm)){
				rotor.start( 'delete_message', {id: that.row.id});
			}
			
			stopBubble(evt);
		}
		
		// добавляем кнопки
		//var branchBtn = addBtn('addbranch', txt.answer);
		//branchBtn.onclick = function(){addMessage(branchBtn);}

		/* if (userID) {
			var plainBtn = this.addBtn('plainanswer', txt.answer);
			plainBtn.onclick = function(){addMessage(plainBtn, 'plain');}
		} */

		if (this.row.author_id == userID || userID == '1'){

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


// Обертка для создания веток. Если откажемся от ветвления - будет не нужна.
function Branch (contArea, topicID, parentID){
	if (!parentID) parentID = topicID;

	var that = this;

	// указание на элемент, в который вставляется новый контейнер
	this.e = contArea;
	
	var more = div('show_more');
	var more_link = newel('a', null, null, txt.show_more);
	var show_all_link = newel('a', null, null, txt.show_all);
	
	more.appendChild(more_link);
	more.appendChild(show_all_link);
	this.e.appendChild(more);

	// создание контейнера для новой ветки
	this.cont = div('branch', 'branch_'+parentID);
	this.e.appendChild(this.cont);
	
	var createBlock = function(row){
		var elem = messages[row.id] = new PostItem(row, contArea, topicID, that);
		
		return elem.item;
	}
	
	this.appendBlock = function(row){
		
		var block = createBlock(row);
		
		var id = parseInt(row.id);
		
		var checked = that.cont.firstChild;
		
		if (checked) do {
			if (id < getID(checked)){
				insBefore(checked, block);
				return block;
			}
		} while	((checked = checked.nextSibling));
		
		that.cont.appendChild(block);
		//addClass(block, 'lastblock');
		//if (prevElem(block)) removeClass(prevElem(block), 'lastblock');
		return block;
	}
	
	var load_more = function(p){
		postsPageLimit = p;
		adress.set('plimit', postsPageLimit);
		rotor.start('next_page');
	}
	
	more_link.onclick = function() {load_more(parseInt(postsPageLimit)+1);}
	
	show_all_link.onclick = function() {load_more(0);}
}


function newTopic(btn){
	
	if (topics[currentTopic]) topics[currentTopic].unmarkActive();
	unloadTopic();
	
	e('@titlebar', '#viewport_posts').innerHTML = txt.new_topic;
	
	answerForm.topicModeOn();
}


function Rotor(parseFunc){
	var that = this;
	
	var req, timeout, startBlocked;
	
	this.timer = siteBlurred ? cfg.poll_timer_blurred : cfg.poll_timer;
	this.maxdateTS = 0;

	// сортировка по умолчанию
	this.topicSort = 'updated';
	this.tsReverse = true;
	
	var stateIndicator = e('@state_ind' ,'#top_bar');
	
	// ФУНКЦИЯ ЦИКЛИЧНОГО ОЖИДАНИЯ
	this.start = function(action, params){
		
		consoleWrite('Launching query with timeout '+that.timer, 1);
		
		// Если есть признаки существования (или некорректной остановки) предыдущего таймера - останавливаем
		if (startBlocked || timeout) that.stop();

		// устанавливаем флаг, блокирующий параллельный старт еще одного запроса
		startBlocked = true;

		that.startIndication(); // индикация ожидания вкл

		// Отправляем запрос
		req = new JsHttpRequest();
		req.onreadystatechange = function() {if (req.readyState == 4) {
			
			// разбираем пришедший пакет и выполняем обновления
			that.maxdateTS = parseFunc(req.responseJS, action);

			that.stopIndication(); // индикация ожидания откл

			startBlocked = false;

			timeout = setTimeout(function(){that.start()}, that.timer);

		}}
		req.open(null, 'backend/update.php', true);
		req.send({
			action: action ? action : null,
			maxdateTS: that.maxdateTS,
			pglimdateTS: pglimit_date,
			curTopic: currentTopic,
			plimit: postsPageLimit, 
			topicSort: that.topicSort,
			tsReverse: that.tsReverse,
			params: params ? params : null
		});
	}
	
	// как-то отмечаем в интерфейсе что запрос ушел
	this.startIndication = function(){
		addClass(stateIndicator, 'updating');
	}
	
	// как-то отмечаем в интерфейсе что запрос закончен
	this.stopIndication = function(){
		removeClass(stateIndicator, 'updating');
	}
	
	// функция, выполняющаяся при отмене уже поданного запроса
	this.doOnAbort = function() {
		that.stopIndication();
	}
	
	// остановщик ожидателя poll
	this.stop = function(){
		
		timeout = advClearTimeout(timeout);
		
		if (startBlocked) {
			// переопределяем orsc, иначе rotor воспринимает экстренную остановку как полноценное завершение запроса
			req.onreadystatechange = that.doOnAbort;
			req.abort();
			req = 0;

			startBlocked = false;

			consoleWrite('STOP occured while WAITING. Query has been ABORTED');
		
		}
	}
	
	// изменение времени ожидания
	this.timeout = function(msec){
		that.timer = msec;
		that.start();
	}
}


// РАЗБОР ПАКЕТА И ВЫПОЛНЕНИЕ ОБНОВЛЕНИЙ
function parseResult(result, actionUsed){
	
	var entry, topic, message;

	var vpPosts  = e('#viewport_posts');
	var vpTopics = e('#viewport_topics');
	
	var postsCont =	 e('@contents'  , vpPosts);
	var pSbar =		 e('@statusbar' , vpPosts);
	var pTbar =		 e('@titlebar'  , vpPosts);
	var topicsCont = e('@contents'  , vpTopics);
	var tSbar =		 e('@statusbar' , vpTopics);
	var tTbar =		 e('@titlebar'  , vpTopics);
	
	if (result && result.error) alert(txt.post_locked);

	var tProps = (result && result.topic_prop) ? result.topic_prop : [];

	// разбираем темы
	if (result && result.topics) {for (var i in result.topics) { 
		entry = result.topics[i];
		
		// если в текущем массиве загруженных тем такая уже есть - обновляем существующую
		if (topics[entry.id]){
			topic = topics[entry.id];
			
			if (entry.deleted){
				
				shownRemove(topic.item);
				if (entry.id == currentTopic) unloadTopic();
				delete(topics[entry.id]);
				
			} else {
				topic.fillData(entry);
				topic.bump();
			}
		
		// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
		} else if (!entry.deleted) {

			topics[entry.id] = new TopicItem(entry);
			topicsCont.appendChild(topics[entry.id].item);
			if (tProps['new']) loadTopic(entry.id);
			ifblur_notify('New Topic: '+entry.topic_name, entry.message);
		}
	}}


	// разбираем сообщения
	if (result && result.posts){

		pTbar.innerHTML = tProps.name;
		
		if (actionUsed == 'next_page') {
			var rememberTop = e('@branch').firstChild;
			var more_height = e('@show_more').offsetHeight;
		}

		for (var i in result.posts) { 
			entry = result.posts[i];
			message = messages[entry.id];

			if (message){ // если в текущем массиве загруженных сообщений такое уже есть

				if (entry.deleted){
					
					shownRemove(message.item);
					delete(messages[entry.id]);
					postSelect(false);
					
				} else message.fillData(entry);

			} else if (!entry.deleted) { // если в текущем массиве такого нет и пришедшее не удалено

				// !! не учитывается ветвление!
				// один из вариантов решения - хранить в базе в поле msg_parent id самого 
				// сообщения, если сообщение заглавное в ветке (т.е. если раньше там было 0)
				// тогда var parent = entry.parent
				var parent = currentTopic;

				// если такой ветки еще нет - создаем 
				if (!branches[parent]) branches[parent] = new Branch(postsCont, currentTopic, parent);

				// добавляем новое сообщение к существующей (или новосозданной) ветке
				branches[parent].appendBlock(entry);

				var lastvisible = messages[entry.id];
			}
		}
		
		if (tProps.show_all) hide(e('@show_more'));
		
		if (tProps.scrollto) messages[tProps.scrollto].item.scrollIntoView(false);
		
		if (rememberTop) {
			rememberTop.scrollIntoView(true);
			postsCont.scrollTop = postsCont.scrollTop-more_height-2;
		}

		// наличие id означает что тема загружается полностью
		if (tProps.id) {
			topics[tProps.id].markActive(); // делаем тему в столбце тем активной

			// если тема загружается не вручную кликом по ней - промотать до неё в списке
			if (!tProps.manual) topics[tProps.id].item.scrollIntoView(false);

			// управляем автопрокруткой
			// Если целевой пост задан в адресе и загружен в теме - проматываем до него
			var refPost = adress.get('message');
			//alert(refPost) ;
			if (messages[refPost]){

				messages[refPost].item.scrollIntoView(true);
				
				postSelect(refPost);

			} else if (tProps.date_read != 'firstRead') {
				// !! тут будет прокрутка до первого непрочитанного поста
				// Сейчас - прокрутка просто до последнего сообщения в теме, если юзер уже читал эту тему
				lastvisible.item.scrollIntoView(false);
			}
		}
		
		if (tProps.pglimit_date) pglimit_date = sql2stamp(tProps.pglimit_date);
	}
	
	
	// добавляем теги
	if (result && result.tags){
		
		for (var i in result.tags) {
		
			entry = result.tags[i];

			if (topics[entry.message]) addTag(topics[entry.message], entry);
		}
	}

	// Выдать новый TS полученный из пакета обновлений
	return sql2stamp(result.new_maxdate);
}


function AnswerForm(container){
	if (userID){
		
		var that = this;
	
		this.container = container;

		this.form = newel('form', null, 'answer_here');
		this.advice = div('advice none');
		this.advice_text = div();
		this.unselect = div('sbtn right', null, '<span>'+txt.cancel_selection+'</span>');
		this.scrollto = div('sbtn right', null, '<span>'+txt.scroll_to_selected+'</span>');
		this.title = newel('input', 'topic_name none');
		this.message = newel('textarea', null, 'textarea_0');
		this.controls = div('controls');
		this.cancel = div('button none', 'cancel_post', '<span>'+txt.cancel+'</span>');
		this.send = div('button', 'send_post', '<span>'+txt.send+'</span>');

		this.message.rows = 1;
		this.title.name = 'topic';
		this.title.type = 'text';

		appendKids( this.form
			, this.title
			, this.message
		);

		appendKids( this.container
			, this.advice
			, this.form
			, this.controls
		);

		appendKids( this.controls
			, this.cancel
			, this.send
			, nuclear()
		);
			
		appendKids( this.advice
			, this.unselect
			, this.scrollto
			, this.advice_text
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

		var action = 'add_post';

		this.send.onclick = function(){

			rotor.start( action , {
				message: that.field.innerHTML,
				title: that.title.value
				//, parent: selectedPost ? selectedPost.row.id : null
			});

			that.field.innerHTML = '';
		}
		
		this.scrollto.onclick = function() {
			if (selectedPost) selectedPost.item.scrollIntoView(false);
		}
		
		this.unselect.onclick = function() {
			postSelect(false);
		}

		this.topicModeOn = function() {
			unhide(that.title);
			action = 'add_topic';
			resize();
		}

		this.topicModeOff = function(){
			that.title.value = '';
			hide(that.title);
			action = 'add_post';
			resize();
		}
		
		this.showAdvice = function(id){
			unhide(that.advice);
			
			var link = messages[id].row;
			
			that.advice_text.innerHTML = txt.will_reply_to + 
				'<span><b>'+link.author+':</b> '+link.message+'</span>';

			resize();
		}
		
		this.hideAdvice = function() {
			hide(that.advice);
			resize();
		}
		
	} else { // если юзер не залогинен
		this.topicModeOn = function(){return;}
		this.topicModeOff = function(){return;}
		this.showAdvice = function(){return;}
		this.hideAdvice = function(){return;}
		container.innerHTML = txt.not_authd_to_post;
	}
}


function startEngine(){
	
	answerForm = new AnswerForm(e('@typing_panel', '#viewport_posts'));
	
	rotor = new Rotor(parseResult);
   
	currentTopic = adress.get('topic');
	postsPageLimit = adress.get('plimit') || postsPageLimit;
	
	var linkMsg, obj={};
	if ((linkMsg = adress.get('message'))){
		obj.directMsg = linkMsg;
	}
	
	rotor.start('load_pages', obj);
}

/*
// AJAX:
JsHttpRequest.query( 'backend/???.php', { // аргументы:
	action: 'load_posts'
}, function(result, errors) { // что делаем, когда пришел ответ:

}, true ); // запрещать кеширование
===============
var req = new JsHttpRequest();
req.onreadystatechange = function() { if (req.readyState == 4) {

}}
req.open(null, 'backend/???.php', true);
req.send({
	action: 'wait_post'
});
*/