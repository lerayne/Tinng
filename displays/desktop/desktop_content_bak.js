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
		wait.start(maxTopicDate);

		e('#debug').innerHTML = errors;
		sbar.innerHTML += ' | '+topics.e.scrollTop;

	}, true /* запрещать кеширование */ );
}

// старый класс апдейтер
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

		for (var i in upds){row = upds[i];

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

		for (var i in upds){row = upds[i];
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

			e('@postsquant', topic).innerHTML = quant[i]+txt['postsquant'];

			// если пришли данные - вбить
			if (row.constructor == Array){

				for (var j in row){post = row[j]

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

function focusDoc(){
	var p = focusDoc.arguments;
	//if (wait) wait.timeout(cfg['posts_updtimer_focused'], cfg['topics_updtimer_focused']);
	e('#logo').style.color = 'red';
	//consoleWrite('focus actions performed');
}

function blurDoc(){
	var p = blurDoc.arguments;
	//if (wait) wait.timeout(cfg['posts_updtimer_blurred'], cfg['topics_updtimer_blurred']);
	e('#logo').style.color = 'blue';
	//consoleWrite('blur actions performed');
}