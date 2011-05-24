var TopicItem = Class ( MessageItem, {
	
	createElems: function(){
		TopicItem.superclass.prototype.createElems.apply(this, arguments);
		
		this.div({
			postsquant: {
				content: this.row['postsquant'] + txt['postsquant'],
				addClass: 'left'
			},
			topicname: {
				content: this.row['topic']
			}
		});
		
		if (this.row['last']['message']){
			
			this.lastpost = div('lastpost', null, 'lastpost_'+this.row['last']['id']);
			this.lastpost.innerHTML = txt['lastpost']+' <span class="author">'+this.row['last']['author']
				+'</span>' + ' ['+this.row['last']['created']+'] '+this.row['last']['message'];
		}
	},
	
	attachActions: function(){
		TopicItem.superclass.prototype.attachActions.apply(this, arguments);
		var that = this;
		
		// по клику на правой колонке - загрузить тему
		this.after_cell.onclick = function(){
			fillPosts(that.row['id']);
			tabs.switchto('posts');
			if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
			addClass(that.item, 'activetopic');
		}
	}	
});

var PostItem = Class( MessageItem, {
	
	attachActions: function(){
		PostItem.superclass.prototype.attachActions.apply(this, arguments);
		var that = this;
		
		// по клику на левой колонке - возвращаемся к темам
		this.before_cell.onclick = function(){
			tabs.switchto('topics');
			if (e('@activetopic')) e('@activetopic').scrollIntoView();
		}
	}
});


function Branch(contArea, topicID, parentID){
	if (!parentID) parentID = topicID;
	var branch = this;
	
	// указание на элемент, в который вставляется новый контейнер
	this.e = contArea;

	// создание контейнера для новой ветки
	this.cont = div(null, 'branch_'+parentID);
	this.e.appendChild(this.cont);
	
	this.coll = [];
	
	this.createBlock = function(row) {
		return (topicID == '0') ? new TopicItem(row, 'topic') : new PostItem(row, 'post');
	}
	
	this.appendBlock = function(row){
		var block = branch.createBlock(row).item;
		branch.cont.appendChild(block);
		addClass(block, 'lastblock');
		if (prevElem(block)) removeClass(prevElem(block), 'lastblock');
		return block;
	}
}

function fillTopics(){
	var container = e('#viewport_topics');
	
	JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

		  action: 'load_topics'
		  , sort: 'updated'
		  , reverse: 'true'

	}, function(result, errors) { // что делаем, когда пришел ответ:
		
		container.innerHTML = '';
		
		topics = new Branch(container, 0);
		
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
		
	}, true /* запрещать кеширование */ );
}

function fillPosts(parent){
	var container = e('#viewport_posts');
	
	JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

		  action: 'load_posts'
		  , id: parent

	}, function(result, errors) { // что делаем, когда пришел ответ:
		
		container.innerHTML = '';
		
		topics = new Branch(container, parent);
		
		// создаем экземпляр содержимого колонки и заполняем его
		for (var i in result['data']) {
			//if(!first) var first = result['data'][i];
			topics.appendBlock(result['data'][i]);
		}

		maxPostDate = sql2stamp(result['maxdate']);
		
	}, true /* запрещать кеширование */ );
}

function startEngine(){
	fillTopics();
}
