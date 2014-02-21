/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include _Unit.js
 */

tinng.protos.PostsUnit = Class(tinng.protos.Unit, {

	construct: function () {
		var that = this;

		t.funcs.bind(this, [
			'topicRename',
			'enterRenameMode',
			'cancelRename',
			'saveName',
			'cancelNewTopic',
			'showNext',
			'showAll',
			'addUserToPrivate',
			'removeUserFromPrivate'
		]);

		t.protos.Unit.prototype
			.construct.apply(this, arguments);

		this.header = new t.protos.ui.Panel([
			{type:'Button', label:'topicRename', cssClass:'right reveal3', icon:'pencil_w.png', tip:tinng.txt.rename_topic},
			{type:'Button', label:'cancel', cssClass:'right', icon:'cancel_w.png', tip:tinng.txt.cancel},
			{type:'Button', label:'save', cssClass:'right', icon:'round_checkmark_w.png', tip:tinng.txt.save},
			//{type:'Button', label:'cancelNewTopic', cssClass:'right', icon:'cancel_w.png', tip:tinng.txt.cancel_new_topic},
			{type:'Field', label:'topicName', cssClass:'topicname'},
			{type:'Field', label:'allowedUsers', cssClass:'allowedUsers'}
		]);
		this.ui.$header.append(this.header.$body);

		this.header.allowedUsersContainer = $('<div class="allowedUsersContainer"></div>').appendTo(this.header.allowedUsers.$body);

		this.header.trashBin = $('<div class="trashBin"></div>');

		if (t.user.id != 0) {
			this.header.trashBin.droppable({
				accept:'.allowedUsersItem',
				activeClass:'acceptable',
				hoverClass:'ready',
				tolerance:'pointer',
				drop:this.removeUserFromPrivate
			});

			this.header.trashBin.appendTo(this.header.$body);
		}

		this.header.allowedUsers.$body.droppable({
			accept:'.userListItem',
			activeClass:'acceptable',
			hoverClass:'ready',
			tolerance:'pointer',
			drop:this.addUserToPrivate,
			activate: function(){
				t.ui.winResize();
			},
			deactivate: function(){
				t.ui.winResize();
			}
		})

		// прячем ненужные пока контролы
		this.header.save.hide();
		this.header.cancel.hide();
		//this.header.cancelNewTopic.hide();

		// расстановка событий
		this.header.topicRename.on('click', this.topicRename);
		this.header.cancel.on('click', this.cancelRename);
		this.header.save.on('click', this.saveName);
		//this.header.cancelNewTopic.on('click', this.cancelNewTopic);

		// проверка прав
		this.header.topicRename.hide();

		this.$showMore = $('<div class="showmore"/>');
		this.ui.$contentWrap.prepend(this.$showMore);

		var showNext = $('<a>' + t.txt.show_more + '</a>');
		var showAll = $('<a>' + t.txt.show_all + '</a>');

		showNext.click(this.showNext);
		showAll.click(this.showAll);

		this.$showMore.append(showNext, showAll);
	},

	// todo - тоже не идеально, но более-менее. Возможно потом доделать
	nullify:function(){
		t.protos.Unit.prototype
			.nullify.apply(this, arguments);

		t.posts = {};

		this.state.topicData = {};
		this.state.allowedUsers = {};
		this.newDialogueMode = false;
		this.topicHeadLoaded = false;

		this.header.allowedUsers.$body.hide();
		this.header.allowedUsersContainer.removeClass('private').children().remove();
		this.header.topicName.$body.html('');
		if (t.user.id > 0) t.units.topics.header.newTopic.unblock();

		this.$showMore.hide();
		this.header.topicRename.hide();

		$('.topics .active').removeClass('active');
	},

	unscribe:function(){

		// если есть подписки
		if (!t.funcs.isEmptyObject(this.subscriptions)){

			// отписываемся от старой темы
			t.connection.unscribe(this, 'posts');
			t.connection.unscribe(this, 'topic_data');

			if (t.state.selectedPost) t.state.selectedPost.deselect('full');
			t.ui.editor.hide();
			t.userWatcher.unwatch(this);

			t.address.del(['topic', 'dialogue', 'plimit', 'post']);

			this.exitRenameMode();
		}

		this.nullify();
	},

	isClear: function () {
		return t.funcs.isEmptyObject(t.posts) && !this.ui.$content.children().size();
	},

	subscribe:function(id, limit, isDialogue){

		// todo - unscribe происходит только если была подписка, иначе - только nullify
		// нужно перенести изначальную подписку из unload в метод этого класса и тогда можно убрать nullify из инициатора
		this.unscribe();

		var postsFeed = {
			feed:'posts',
			limit: limit
		}

		var topicsFeed = {
			feed:'topic'
			//,fields:['id', 'date_read', 'name', 'post_count'] // пока не работает
		}

		if (typeof isDialogue == 'undefined' || !isDialogue) {
			postsFeed.topic = id;
			topicsFeed.id = id;
			t.address.set('topic', id);
		} else {
			postsFeed.dialogue = id;
			topicsFeed.dialogue = id;
			t.address.set('dialogue', id);
		}

		t.address.set('plimit', limit);

		// подписываемся на новую
		t.connection.subscribe([
			{
				subscriber:this,
				feedName:'posts',
				feed: postsFeed
			},{
				subscriber:this,
				feedName:'topic_data',
				feed: topicsFeed
			}
		]);
	},

	addUserToPrivate: function(e, ui){
		var that = this;
		var userId = ui.draggable.attr('data-user');

		// todo - сделать проверку на авторство, если тема была открытой


		if (t.user.id == 0) return false; // не пускаем анонима
		if (this.state.allowedUsers[userId]) return false; // не добавляем, если такой уже есть
		// если тема открытая - разрешаем добавлять людей только ее автору
		if (t.funcs.isEmptyObject(this.state.allowedUsers) && t.user.id != this.state.topicData.author_id) return false;

		this.header.allowedUsersContainer.addClass('private');

		JsHttpRequest.query('backend/service.php',
			{
				action: 'add_to_private',
				user_id: userId,
				topic_id: this.subscriptions.topic_data.id
			},
			function(userData, error){

				if (error) console.error(error)
				if (userData) {

					that.renderPrivateUser(userData);

					// если меня еще нет
					if (!that.state.allowedUsers[t.user.id]){
						that.renderPrivateUser(t.user.data)
					}
				}
			},
			true // no cache
		);
	},

	// допустим $_ - приватный метод
	$_removeUserFromPrivate:function(userId){
		var that = this;

		JsHttpRequest.query('backend/service.php',
			{
				action: 'remove_from_private',
				user_id: userId,
				topic_id: this.subscriptions.topic_data.id
			},
			function(userId, error){
				if (error) console.error(error)
				if (userId) {
					that.unrenderPrivateUser(userId);

					// если ты удалил себя а в теме еще кто-то есть - закрыть у себя тему
					if (userId == t.user.id && t.funcs.objectSize(that.state.allowedUsers) > 0) {
						this.unscribe();
					}
				}
			},
			true // no cache
		);
	},

	removeUserFromPrivate:function(e, ui){
		var that = this;
		var userId = ui.draggable.attr('data-user');

		if (t.funcs.objectSize(this.state.allowedUsers) > 1 && userId == t.user.id && this.state.topicData.author_id == t.user.id) {
			console.warn("you can only remove yourself from YOUR topic if you're the last person with access");
			return false;
		}

		// если ты не админ, не автор темы и удалить пытаешься не себя - запретить
		if (t.user.id != 1 && this.state.topicData.author_id != t.user.id && userId != t.user.id){
			console.warn("you can't remove user from someone else's topic");
			return false;
		}

		if (t.user.id == userId) {

			var warnText = t.funcs.objectSize(this.state.allowedUsers) > 1 ? t.txt.warn_unaccess_yourself : t.txt.warn_making_public;
			if (confirm(warnText)) this.$_removeUserFromPrivate(userId);

		} else {
			this.$_removeUserFromPrivate(userId);
		}
	},

	renderPrivateUser:function(userData){
		var user = this.state.allowedUsers[userData.id] = this.createUserElement(userData, 'allowedUsersItem', true);
		this.header.allowedUsersContainer.addClass('private');
		user.appendTo(this.header.allowedUsersContainer);
	},

	unrenderPrivateUser:function(userId){
		this.state.allowedUsers[userId].remove();
		delete (this.state.allowedUsers[userId]);
		if (!t.funcs.objectSize(this.state.allowedUsers)) this.header.allowedUsersContainer.removeClass('private');
	},

	addNode: function (node) {

		var posts = this.ui.$content.children();

		// если id поста меньше, чем id одного из уже загруженных - вставляем раньше ...
		if (posts.size()) for (var i = 0; i < posts.length; i++) {
			var $post = $(posts[i]);
			if (node.id < parseInt($post.attr('data-number'))) {
				node.$body.insertBefore($post);
				// .. и завершаем работу метода
				return true;
			}
		}

		// если не завеошили выше - пользуемся дефолтом из класса-предка
		t.protos.Unit.prototype['addNode'].call(this, node);
	},

	setInvitation: function () {
		this.ui.$content.append(t.chunks.get('posts-default').$body);
	},

	/*startWaitIndication:function(){
	 this.ui.$scrollArea.addClass('loading');
	 },*/

	onScroll: function () {

		t.protos
			.Unit.prototype
			.onScroll.apply(this, arguments);

		if (this.contentLoaded) {
			if (this.atTop) {
//				t.funcs.loadMore(t.sync.plimit+1);
//				console.log('top reached');
			}

			if (this.atBottom) {
//				console.log('bottom reached')
			}
		}
	},

	showNext: function () {
		this.loadMore(t.funcs.objectSize(t.posts) + t.cfg.posts_per_page);
	},

	showAll: function () {
		this.loadMore(0);
	},

	loadMore: function(newLimit){
		t.address.set('plimit', newLimit)
		t.connection.rescribe(this, 'posts', {
			limit: newLimit
		})
	},

	topicRename: function () {
		JsHttpRequest.query('backend/service.php', { // аргументы:
			action: 'check_n_lock',
			id: t.sync.curTopic
		}, this.enterRenameMode, true);

		return false;
	},

	enterRenameMode: function (result, errors) {

		if (result.locked !== null) {

			if (t.user.id == '1') {
				if (confirm(t.txt.post_locked + '\n' + t.txt.post_locked_admin)) {
					this.unlock()
				} else {
					this.mainPanel.unlock.$body.show();
				}
			} else alert(t.txt.post_locked);

		} else {

			this.state.renameFrom = this.header.topicName.$body.html();

			this.header.topicRename.hide();

			this.header.save.show();
			this.header.cancel.show();

			this.header.topicName.$body.attr('contenteditable', true);
			this.header.topicName.$body.focus();
		}
	},

	exitRenameMode: function () {

		if (this.state.renameFrom) {
			this.state.renameFrom = false;

			this.header.topicRename.show();
			this.header.save.hide();
			this.header.cancel.hide();

			this.header.topicName.$body.removeAttr('contenteditable');
		}
	},

	cancelRename: function () {

		this.unlock();
		this.header.topicName.$body.html(this.state.renameFrom);

		this.exitRenameMode();

		return false;
	},

	saveName: function () {

		var newName = this.header.topicName.$body.text();

		// todo - сделать универсальную проверялку валидности вводимого текста
		if (!newName.match(t.rex.empty)) {
			t.connection.write({
				action:'update_message',
				id: this.subscriptions['posts'].topic,
				topic_name: newName
			});

			this.exitRenameMode();
		} else alert ('null length')

		return false; // preventDefault + stopPropagation
	},

	unlock: function () {
		JsHttpRequest.query('backend/service.php', { // аргументы:
			action: 'unlock_message',
			id: t.sync.curTopic
		}, function () {
		}, true);

//		this.mainPanel.unlock.$body.hide();

		return false; // preventDefault + stopPropagation
	},

	newTopic: function () {

		this.unscribe();

		t.units.topics.header.newTopic.block();
		this.header.topicName.$body.html(t.txt.new_topic_creation);

		this.addNode(this.createTopicEditNode());

		return false;
	},

	createTopicEditNode:function(topic){
		var that = this;

		var node = t.chunks.get('topic-edit');

		this.newTags = [];

		var searchBoxParams = {
			placeholder: t.txt.enter_tags,
			tagsOnly:true,
			onConfirm: function (tagSet) {
				that.newTags = tagSet
			}
		}

		if (typeof topic == 'undefined') {
			node.$button_save.val(t.txt.new_topic_btn_create);
		}

		this.searchBox = new t.protos.ui.SearchBox(searchBoxParams);
		node.$tagbox.append(this.searchBox.$body);

		node.$button_cancel.click(this.cancelNewTopic);

		var ckconf = {
			enterMode: CKEDITOR.ENTER_BR,
			forceEnterMode:CKEDITOR.ENTER_BR,
			toolbarLocation:'bottom',
			height:'auto'
		};

		ckconf.toolbar = [['Bold', 'Italic', 'Strike', '-', 'RemoveFormat', '-', 'Blockquote', '-','Link', 'Unlink', '-','Source']];

		this.ck = CKEDITOR.replace(node.$input_body[0], ckconf);

		node.$button_save.click(function(){

			var body = that.ck.getData();

			if (!node.$input_title.val().match(t.rex.empty) && !body.match(t.rex.empty)) {

				that.exitNewTopicMode();

				t.connection.write({
					action:'add_topic',
					title: node.$input_title.val(),
					message: body,
					tags:that.newTags
				})

			} else {
				alert('title and body can not be empty')
			}
		})

		return {$body: node.$body};
	},

	exitNewTopicMode: function () {
		this.ck.destroy();
		this.ui.$content.children().remove();
		t.units.topics.header.newTopic.unblock();
	},

	cancelNewTopic: function () {

		this.exitNewTopicMode();
		this.setInvitation();

		return false;
	},

	displayTopicName: function (name) {
		this.header.topicName.$body.html(name)
	},

	// todo - сделано наспех, сделать нормальный класс!
	createUserElement:function(userData, addClass, draggable) {
		var listItem = t.chunks.get('userListItem');

		listItem.$body.addClass('user-'+userData.id).attr('data-user', userData.id);
		listItem.$avatar.prop('src', userData.avatar);
		listItem.$name.text(userData.display_name);

		if (typeof addClass != 'undefined') {
			listItem.$body.addClass(addClass);
		}

		if (typeof draggable != 'undefined') {
			listItem.$body.draggable({
				helper:"clone",
				appendTo:"#tinng-main-content",
				distance:5,
				scroll:false
			});
		}

		return listItem.$body;
	},

	parseFeed: function (feed, actionsUsed) {
		this.stopWaitIndication();

		//console.log('actionsUsed (posts parser):', actionsUsed);

		// разбираем посты
		if (feed.posts) this.parsePosts(feed.posts);

		// разбираем свойства темы
		if (feed.topic_data) this.parseTopicData(feed.topic_data);
	},

	parsePosts: function (postsList) {

		var thisParse = {};
		var now = new Date();

		// определяем, загружается ли тема с нуля
		var firstLoad = this.isClear();

		// считываем инфу о ссылке на конкретное сообщение и достаем тему из подписки
		var referedPost = t.address.get('post');
		var referedTopic = t.address.get('topic')
		var currentTopic = this.subscriptions['posts'].topic;

		// какова была позиция прокрутки перед парсингом?
		var wasAtBottom = this.atBottom;
		var wasAtTop = this.atTop;

		if (!firstLoad && wasAtTop) { // нужно для догрузки

			var topPost = t.units.posts.ui.$content.children().eq(0);
			var topPostOffset = topPost.position().top;
		}

		// собственно, разбор пришедших сообщений
		for (var i in postsList) {
			var postData = postsList[i];
			var existingPost = t.posts[postData.id];

			// обрабатываем информацию о непрочитанности
			var modifier = parseInt(postData.modifier_id, 10);
			var author = parseInt(postData.author_id, 10);

			// если сообщение было изменено и юзер - его редактор - не показывать непрочитанным, кем бы не был создатель
			if (!isNaN(modifier) && modifier > 0) {
				if (modifier == t.user.id) postData.unread = '0';
			} else if (author == t.user.id) {
				// если сообщение не редактировалось - не показываем непрочитанность, если юзер - автор
				postData.unread = '0';
			}

			if (existingPost) { // если в текущем массиве загруженных сообщений такое уже есть

				if (postData.deleted == 1) {
					existingPost.remove();
					delete t.posts[postData.id];
				} else {
					existingPost.fill(postData);

					// сообщение о модификации может прийти только от пользователя, который сейчас онлайн
					t.userWatcher.forceToOnline(postData.modifier)
				}

			} else if (!postData.deleted || postData.deleted == 0) { // если такого нет и пришедшее не удалено - создаем новый

				var newPost = t.posts[postData.id] = new t.protos.PostNode(postData);
				this.addNode(newPost);

				// добавляем автора в список отслеживаемых онлайн-статусов
				t.userWatcher.watch(this, postData.author_id);

				// если сообщение создано недавно - значит автор сейчас онлайн
				if (now.getTime() - t.funcs.phpts2date(postData.author_seen_online).getTime() < t.cfg.online_threshold * 1000) {
					t.userWatcher.forceToOnline(postData.author_id)
				}

				// этот флаг может означать не только указание на выделение, поэтому выделение тянем из адрессной строки
				if (postData.refered) {
					thisParse.scrollTo = newPost;
				}

				if (postData.head) this.topicHeadLoaded = true;
			}
		}

		// смотрим, загружено ли уже стартовое сообщение
		// var topicHeadLoaded = !!t.posts[currentTopic];

		// если есть (или будет) заглавный пост - скрываем догрузочные кнопки
		if (this.topicHeadLoaded) {
			this.$showMore.hide();
		} else {
			this.$showMore.show();
		}

		// управление прокруткой
		if (firstLoad) {

			if (thisParse.scrollTo) {
				// прокрутка до поста, указанного в фиде как референсный
				thisParse.scrollTo.show(true);

			} else if (referedPost && t.posts[referedPost] && currentTopic == referedTopic) {
				// прокрутка до поста, вычитанного из адреса
				t.posts[referedPost].select();
				t.posts[referedPost].show(true);

			} else {

				// иначе прокрутить до низа
				this.scrollToBottom();
			}

		} else if (wasAtBottom) { // если апдейт или догрузка и тема была прокручена вниз

			this.scrollToBottom();

		} else if (wasAtTop) { // если догрузка и тема была прокручена до верха

			// todo - неправильно прокручивается, если до догрузки все сообщения помещались и прокрутка не появлялась
			topPost.scrollIntoView(true);
			t.units.posts.ui.$scrollArea.scrollTop(t.units.posts.ui.$scrollArea.scrollTop() - topPostOffset);
		}



		// todo разобраться почему работает только через анонимную функцию
		setTimeout(function () {
			this.contentLoaded = 1
		});

		//this.setContentLoaded();
	},



	parseTopicData: function (topicData) {

		this.state.topicData = topicData;

		// выгружаем удаленную тему
		if (topicData.deleted == 1) {

			//console.log('TOPIC DELETED')
			this.unscribe();
		
		} else {

			t.ui.editor.show();
			
			if (topicData.dialogue > 0) { // если мы имеем дело с потоком ЛС

				// хайд верхнего контейнера дает не только скрытие, но и отсутствие показа при такскании
				this.header.allowedUsers.$body.hide();

				for (var i = 0; i < topicData.private.length; i++) {
					var user = topicData.private[i];
					if (user.id != t.user.id) break;
				}

				this.state.topicData.dialogue = user.id;
				var $user = this.createUserElement(user);

				this.displayTopicName(t.txt.dialogue_width);
				var dialogueWrap = $('<div class="dialogueWrap">').appendTo(this.header.topicName.$body);
				dialogueWrap.append($user);

				if (topicData.new_dialogue) this.newDialogueMode = 1;
				else this.newDialogueMode = 0;
				
			} else { // иначе - обычная тема

				if (t.user.hasRight('editMessage', topicData)) t.units.posts.header.topicRename.show();
				
				this.displayTopicName(topicData.topic_name); //вывод названия темы

				if (typeof topicData.private == 'object' && topicData.private.length) {

					this.header.allowedUsersContainer.addClass('private');
					this.header.allowedUsers.$body.show();

					this.header.allowedUsersContainer.children().remove();

					this.header.allowedUsersContainer.removeClass('none');

					for (var i = 0; i < topicData.private.length; i++) {
						this.renderPrivateUser(topicData.private[i])
					}
				} else {
					this.header.allowedUsersContainer.removeClass('private');
					// если пользователь не имеет права делать тему приватной - не показываем даже окошко
					if (t.user.id == topicData.author_id || t.user.id == 1) {
						this.header.allowedUsers.$body.show();
					} else {
						this.header.allowedUsers.$body.hide();
					}
				}
			}
		}

		// хак прочитанности первого сообщения
		var latestReadTS = t.funcs.sql2stamp(topicData.modified ? topicData.modified : topicData.created);

		if (topicData.post_count == 1) {
			$.event.trigger({
				type: 'read_topic',
				message:{
					id: topicData.id,
					time: latestReadTS,
					author: topicData.author_id,
					dialogue: topicData.dialogue
				}
			})
		}

		// todo - в будущем тут будет проверка на наличие модулей, подписанных на список тем
		if (t.topics && t.topics[topicData.id]) {

			// если тема есть, но она не выделена - значит тема грузилась не кликом по ней
			if (!t.topics[topicData.id].isSelected()) {

				t.topics[topicData.id].select(); // сделать актвной
				// todo - изменить везде show на scrollTo или что-то подобное
				t.topics[topicData.id].show(false); // промотать до нее
			}
		}

		// todo - если введем автовысоту через css - убрать
		t.ui.winResize(); // потому что от размера названия темы может разнести хедер
	}
});
