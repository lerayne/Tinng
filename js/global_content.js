var MessageItem = Class({
	
	div: function(collection){
		
		for (var i in collection) { var prop = collection[i];

			this[i] = div(i, prop.id, prop.content);

			if (prop.addClass) this[i].className += ' '+prop.addClass;
			if (prop.className) this[i].className = prop.className;
		}
	},
	
	// Создание элементов (универсальных, которые есть во всех объектах)
	createElems: function(row, contArea, topicID, branch){
		
		this.row = row; // здесь не нужно, но используется в наследующих классах
		
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
			parent:		[],
			message:	[],
			tags:		[]
		});
		
		this.parent_link = newel('a');
	},
	
	fillData: function(row){
		
		this.row = row;
		
		this.created.innerHTML	= this.row.modified ? txt.modified + this.row.modified : this.row.created;
		
		if (this.row.modifier && this.row.modifier != this.row.author_id) 
			this.created.innerHTML += ' (' + this.row.modifier_name + ')';
		
		this.author.innerHTML	= txt.from + this.row.author;
		
		this.msgid.innerHTML	= '&nbsp;#' + this.row.id + '&nbsp;';
		
		this.message.innerHTML	= this.row.message;
		
		//if (this.row.parent_id != this.row.topic_id) 
		//	this.parent.innerHTML = 'parent: '+this.row.parent_id;
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
			, this.tags
			//, this.debug
			, this.controls 
			, nuclear()
		);

		appendKids ( this.infobar
			, this.avatar
			, this.created
			, this.parent
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