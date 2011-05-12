var MessageItem = Class({
	
	initialize: function(row, type, contArea, topicID, branch){
		this.populate(row, type, contArea, topicID, branch);
		this.attachActions();
		this.assemble();
		return this.container;
	},
	
	div: function(obj){
		createDivs(this, obj);
	},
	
	// Создание элементов (универсальных, которые есть во всех объектах)
	populate: function(row, type, contArea, topicID, branch){
		
		this.row = row;
		this.type = type;
		if (contArea) this.contArea = contArea;
		if (topicID) this.topicID = topicID;
		if (branch) this.branch = branch;
		
		this.container = div(this.type, this.type+'_'+this.row['id']);
		
		this.div({ 
			before_cell:[],
			after_cell:	[],
			data_cell:	[],
			infobar:	[],
			debug:		[],
			controls:	[],
			
			explain: {
				addClass: 'subtext'
			},
			
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
	}
});