var Item = Class({
	
	initialize: function(row, type){
		this.populate(row, type);
		this.attachActions();
		this.assemble();
	},
	
	div: function(obj){
		createDivs(this, obj);
	},
	
	// Создание элементов (универсальных, которые есть во всех объектах)
	populate: function(row, type){
		
		this.row = row;
		this.type = type;
		
		this.container = div(this.type, this.type+'_'+this.row['id']);
		
		this.div({ 
			before_cell:[],
			after_cell:	[],
			data_cell:	[],
			infobar:	[],
			debug:		[],
			controls:	[],
			explain:	[],
			
			created: {
				content: this.row['modified'] ? txt['modified']+this.row['modified'] : this.row['created'],
				addClass: 'right'
			},
			
			author: {
				content: txt['from']+this.row['author'],
				addClass: 'left'
			},
			
			msgid: {
				content: '&nbsp;#'+this.row['id']+'&nbsp;',
				addClass: 'left'
			},
			
			message: {
				content: this.row['message']
			}
			
		});
	},
	
	// Созданеи действий с объектами
	attachActions: function(){},
	
	// сборка объектов в фрагмент DOM
	assemble: function(){
		
		appendKids ( this.container
			, this.before_cell
			, this.data_cell
			, this.after_cell
		);

		appendKids ( this.data_cell
			, this.infobar
			, this.topicname
			, this.message
			, this.lastpost
			, this.debug
			, this.controls 
			, nuclear()
		);

		appendKids ( this.infobar
			, this.created
			, this.author
			, this.msgid
			, this.postcount
			, nuclear()
		);
	}
});


var Topic = Class (Item, {
	
	populate: function(){
		Item.prototype.populate.apply(this, arguments);
		
		this.div({
			postcount: {
				content: this.row['postcount'] + txt['postcount'],
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
		Item.prototype.attachActions.apply(this, arguments);
		var that = this;
		
		// по клику на правой колонке - загрузить тему
		this.after_cell.onclick = function(){
			fillPosts(that.row['id']);
			tabs.switchto('posts');
			if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
			addClass(that.container, 'activetopic');
		}
	}	
});

var Post = Class(Item, {
	
	attachActions: function(){
		Item.prototype.attachActions.apply(this, arguments);
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
	this.cont = newel('div', null, 'branch_'+parentID);
	this.e.appendChild(this.cont);
	
	this.coll = [];
	
	this.createBlock = function(row) {
		return (topicID == '0') ? new Topic(row, 'topic') : new Post(row, 'post');
	}
	
	this.appendBlock = function(row){
		var block = branch.createBlock(row).container;
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
