var Item = Class({
	
	initialize: function(row, type){
		this.populate(row, type);
		this.attachActions();
		this.construct();
	},
	
	// Создание элементов (универсальных, которые есть во всех объектах)
	populate: function(row, type){
		
		this.row = row;
		this.type = type;
		
		this.container = div(this.type, this.type+'_'+this.row['id']);

		thisClassedDiv( this, {	
			  before_cell:	[]
			, data_cell:	[]
			, after_cell:	[]
			, infobar:		[]
			, created:		[this.row['modified'] ? txt['modified']+this.row['modified'] : this.row['created'], 'right']
			, author:		[txt['from']+this.row['author'], 'left']
			, msgid:		['&nbsp;#'+this.row['id']+'&nbsp;', 'left']
			, message:		[this.row['message']]
			, debug:		[]
			, controls:		[]
			, explain:		[]
		});
	},
	
	// программируем кнопки
	attachActions: function(){},
	
	// сборка шаблона
	construct: function(){
		
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
		
		thisClassedDiv( this, {
			  postcount: [this.row['postcount'] + txt['postcount'], 'left']
			, topicname: [this.row['topic'] ? this.row['topic'] : '&nbsp;']
		});
		
		if (this.row['last']['message']){
			thisClassedDiv( this, {
				lastpost: [null, null, 'lastpost_'+this.row['last']['id']]
			});
			this.lastpost.innerHTML = txt['lastpost']+' <span class="author">'+this.row['last']['author']
				+'</span>' + ' ['+this.row['last']['created']+'] '+this.row['last']['message'];
		}
	},
	
	attachActions: function(){
		Item.prototype.attachActions.apply(this, arguments);
		var that = this;

		this.after_cell.onclick = function(){
			fillPosts(that.row['id'], e('#viewport_posts'));
			tabs.switchto('posts');
			if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
			addClass(that.container, 'activetopic');
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
		//var type = (topicID == '0') ? 'topic' : 'post';
		return new Topic(row, 'topic');
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

function fillPosts(){
	return;
}

function startEngine(){
	fillTopics();
}
