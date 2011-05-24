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
	createElems: function(row, contArea, topicID, branch){
		
		this.row = row;
		
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
			item:		[],
			explain:	{ addClass: 'subtext' },
			created:	{ addClass: 'right' },
			author:		{ addClass: 'left' },
			msgid:		{ addClass: 'left' },
			message:	[]
		});
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
		
		appendKids ( this.item
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
			, this.postsquant
			, nuclear()
		);
	},
	
	initialize: function(row, contArea, topicID, branch){
		this.createElems(row, contArea, topicID, branch);
		this.fillData(row);
		this.attachActions();
		this.assemble();
	}
});