var Elem = Class({
	
	initialize: function(CSSclass, ID, HTML){
		this.e = div(CSSclass, ID, HTML);
	},
	
	blockAndWait: function(){
		this.e.className += ' throbber';
	}
});

var MessageItem = Class({
	
	div: function(collection){
		
		for (var i in collection) { var prop = collection[i];

			this[i] = div(i, prop['id'], prop['content']);

			if (prop['addClass']) this[i].className += ' '+prop['addClass'];
			if (prop['className']) this[i].className = prop['className'];
		}
	},
	
	// Создание элементов (универсальных, которые есть во всех объектах)
	createElems: function(row, type, contArea, topicID, branch){
		
		this.row = row;
		this.type = type;
		
		if (contArea) this.contArea = contArea;
		if (topicID) this.topicID = topicID;
		if (branch) this.branch = branch;
		
		this.div({
			before_cell:[],
			after_cell:	[],
			data_cell:	[],
			infobar:	[],
			debug:		[],
			controls:	[],
			container: { className: this.type },
			explain: { addClass: 'subtext' },
			created: { addClass: 'right' },
			author: { addClass: 'left' },
			msgid: { addClass: 'left' },
			message: []
		});
		
		this.container.id = this.type+'_'+this.row['id'];
	},
	
	fillData: function(row){
		
		this.row = row;
		
		this.created.innerHTML	= this.row['modified'] ? txt['modified']+this.row['modified'] : this.row['created'];
		this.author.innerHTML	= txt['from']+this.row['author'];
		this.msgid.innerHTML	= '&nbsp;#'+this.row['id']+'&nbsp;';
		this.message.innerHTML	= this.row['message'];
	},
	
	// Создание действий с объектами
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
			// , this.debug
			, this.controls 
			, nuclear()
		);

		appendKids ( this.infobar
			, this.avatar
			, this.created
			, this.author
			, this.msgid
			, this.postcount
			, nuclear()
		);
	},
	
	initialize: function(row, type, contArea, topicID, branch){
		this.createElems(row, type, contArea, topicID, branch);
		this.fillData(row);
		this.attachActions();
		this.assemble();
	}
});