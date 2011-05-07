function Item () {}
Item.prototype = {
	
	// Создание универсальных элементов
	populate: function(row, type){
	
		this.container = div(type, type+'_'+row['id']);

		thisClassedDiv( this, {	
			  before_cell:	[]
			, data_cell:	[]
			, after_cell:	[]
			, infobar:		[]
			, created:		[row['modified'] ? txt['modified']+row['modified'] : row['created'], 'right']
			, author:		[txt['from']+row['author'], 'left']
			, msgid:		['&nbsp;#'+row['id']+'&nbsp;', 'left']
			, message:		[row['message']]
			, debug:		[]
			, controls:		[]
			, explain:		[]
		});
	}, 
	
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
}

function Topic(row) {
	this.populate(row, 'topic');
	
	thisClassedDiv( this, {
		  postcount: [row['postcount'] + txt['postcount'], 'left']
		, topicname: [row['topic'] ? row['topic'] : '&nbsp;']
	});

	if (row['last']['message']){
		thisClassedDiv( this, {
			lastpost: [null, null, 'lastpost_'+row['last']['id']]
		});
		this.lastpost.innerHTML = 
			txt['lastpost']+' <span class="author">'+row['last']['author']
			+'</span>' + ' ['+row['last']['created']+'] '+row['last']['message'];
	}

	this.after_cell.onclick = function(){
		fillPosts(row['id'], e('#viewport_posts'));
		tabs.switchto('posts');
		if (e('@activetopic')) removeClass(e('@activetopic'), 'activetopic');
		addClass(this.container, 'activetopic');
	}

	this.construct();
}

extend(Item, Topic);

function TopicFin(row){
	TopicFin.superclass.constructor.apply(this, arguments);
}

extend(Topic, TopicFin);


/*
function Post (row, type) {
	
}
extend(Item, Post);
*/
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
		return new Topic(row);
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
