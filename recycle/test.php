<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<script src="/libraries/jquery-1.7.2.min.js"></script>
		
		<script>
			
			var templates = {}, topics = [];
			
			var create = function(){
				var el1 = document.createElement('div');
					el1.className += ' item';
					el1.className += ' topic';
					el1.className += ' activetopic';
					el1.className += ' revealer';
				var el2 = document.createElement('div');
					el2.className += ' beforecell';
				var el3 = document.createElement('div');
					el3.className += ' datacell';
				var el4 = document.createElement('div');
					el4.className += ' aftercell';
				var el5 = document.createElement('div');
					el5.className += ' created';
					el5.className += ' right';
					el5.className += ' reveal';
				var el6 = document.createElement('div');
					el6.className += ' author';
					el6.className += ' left';	
				var el7 = document.createElement('div');
					el7.className += ' left';
					el7.className += ' msgid';
				var el8 = document.createElement('div');
					el8.className += ' postquant';
					el8.className += ' reveal';
				var el9 = document.createElement('div');
					el9.className += ' topicname';
				var el0 = document.createElement('div');
					el0.className += ' message';
					
				var el11 = document.createElement('div');
				var el12 = document.createElement('div');
				var el13 = document.createElement('div');
				var el14 = document.createElement('div');
				var el15 = document.createElement('div');
				var el16 = document.createElement('div');
				var el17 = document.createElement('div');
				var el18 = document.createElement('div');
				var el19 = document.createElement('div');
				
				

				el1.appendChild(el2);
				el1.appendChild(el3);
				el1.appendChild(el4);
				
				el3.appendChild(el5);
				el3.appendChild(el6);
				el3.appendChild(el7);
				el3.appendChild(el8);
				el3.appendChild(el9);
				el3.appendChild(el0);
				
				el4.appendChild(el11);
					el0.className += ' message1';
				el11.appendChild(el12);
				el11.className += ' message1';
				el11.className += ' message2';
				el11.className += ' message3';
				el11.className += ' message4';
				el12.appendChild(el13);
				el12.className += ' message1';
				el12.className += ' message2';
				el12.className += ' message3';
				el12.className += ' message4';
				el13.appendChild(el14);
				el13.className += ' message1';
				el13.className += ' message2';
				el13.className += ' message3';
				el13.className += ' message4';
				el14.appendChild(el15);
				el14.className += ' message1';
				el14.className += ' message2';
				el14.className += ' message3';
				el14.className += ' message4';
				el15.appendChild(el16);
				el15.className += ' message1';
				el15.className += ' message2';
				el15.className += ' message3';
				el15.className += ' message4';
				el16.appendChild(el17);
				el16.className += ' message1';
				el16.className += ' message2';
				el16.className += ' message3';
				el16.className += ' message4';
				el17.appendChild(el18);
				el17.className += ' message1';
				el18.appendChild(el19);
				


				return el1;
			}
			
			var data = {
				id: 76,
				created: 'изменено 2011-07-18 18:20:43',
				author: 'lerayne',
				postquant: 48,
				topicname: 'Тема для пустого трепа',
				message: 'Тут можно пообщаться, наверное :) ....<br>'
			}
			
			
			
			var TopicClass = function(tofill, container){
				
				var $this = $(this);
				var self = this;
				
				var el = this.element = $(this.templates.topic.cloneNode(true));
				//var el = $(create());
				
				
				this.populate = function(row){
					
					
				}
				
				container.appendChild(el[0]);
				
				this.populate(tofill);
			}
			
			TopicClass.prototype.templates = templates;
			
			TopicClass.prototype.populate = function(row){
				this.created = el.find('.created');
				this.author = el.find('.author');
				this.msgid = el.find('.msgid');
				this.postquant = el.find('.postquant');
				self.topicname = el.find('.topicname .content');
				self.message = el.find('.message');

				el.attr('id', 'topic_'+row.id);
				self.created.text(row.created);
				self.author.text(row.author);
				self.msgid.text('&nbsp;'+row.id+'&nbsp;');
				self.postquant.text(row.postquant+' сообщ.');
				self.topicname.text(row.topicname);
				self.message.html(row.message);
			}
			
			
			
			$(function(){
				
				var container = $('body')[0];
				var fragment = document.createDocumentFragment();
				
				templates.topic = document.getElementById('topic');
				var i;
				for (i = 0; i < 2000; i++){
					topics[i] = new TopicClass(data, fragment);
				}
				container.appendChild(fragment)
				
			});
			
			var that = {'a':1, 'b':2};
			
			element.click = $.proxy(onClick, that);
			
		</script>
		
		<style>
			#templates {display: none;}
		</style>
	</head>
	<body>
		
		<ul id="templates">
			
			<ul id="topic">
				<div class="item revealer topic activetopic">
					<div class="before_cell"></div>
					<div class="data_cell">
						<div class="infobar">
							<div class="created right reveal" data-created></div>
							<div class="parent"></div>
							<div class="author left" data-author></div>
							<div class="msgid left" data-msgid></div>
							<div class="postsquant reveal" data-postquant></div>
							<div class="clearboth"></div>							
						</div>
						<div class="topicname editabletopic revealer2">
							<div class="left content" data-topicname>Тема для пустого трепа</div>
							<div class="sbtn btn_topicedit right reveal2"></div>
							<div class="sbtn btn_topiccancel right none"></div>
							<div class="sbtn btn_topicsubmit right none"></div>
							<div class="clearboth"></div>							
						</div>
						<div class="message" data-message>Тут можно пообщаться, наверное :) ....<br></div>
						<div class="tags"></div>
						<div class="controls reveal"></div>
						<div class="clearboth"></div>						
					</div>
					<div class="after_cell"></div>					
				</div>
			</ul>
			
		</ul>
		
	</body>
</html>
