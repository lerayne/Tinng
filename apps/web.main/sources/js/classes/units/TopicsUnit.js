/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include _Unit.js
 */

tinng.protos.TopicsUnit = Class(tinng.protos.Unit, {

	construct: function () {
		var that = this;
		t.funcs.bind(this, ['newTopic', 'setTopicsStyle', 'setTopicsSort']);

		t.protos
			.Unit.prototype
			.construct.apply(this, arguments);

		this.header = new t.protos.ui.Panel([
			{type:'Button', label:'newTopic', cssClass:'right', icon:'doc_plus_w.png', text:tinng.txt.new_topic}
		]);
		this.ui.$header.append(this.header.$body);

		// выбор стиля отображения
		this.styleSelect = new t.protos.ui.RadioGroup({
			name: 'topics_style',
			elements: [
				{type:'header', text:t.txt.topics_view_setting},
				{type:'radio', value:'middle', text:t.txt.topics_view_middle},
				{type:'radio', value:'short', text:t.txt.topics_view_short}
			],
			onClick: this.setTopicsStyle,
			cookie:'topics_style'
		});

		this.ui.$content.addClass(this.styleSelect.getValue()); // присваиваем контейнеру класс

		this.styleSelect.$body.addClass('settings-group');
		this.styleSelect.placeTo(this.ui.$settingsDropdown);

		// Выбор сортировки тем
		this.topicsSort = new t.protos.ui.RadioGroup({
			name:'topics_sort',
			elements:[
				{type:'header', text: t.txt.topics_sort_setting},
				{type:'radio', value:'updated', text: t.txt.topics_sort_updated},
				{type:'radio', value:'created', text: t.txt.topics_sort_created},
				{type:'radio', value:'topic_name', text: t.txt.topics_sort_name}
			],
			onClick:this.setTopicsSort,
			cookie:'topics_sort'
		});

		this.topicsSort.$body.addClass('settings-group');
		this.topicsSort.placeTo(this.ui.$settingsDropdown);

		// Выбор направления сортировки
		this.topicsSortDir = new t.protos.ui.RadioGroup({
			name:'topics_sort_dir',
			cookie:'topics_sort_dir',
			onClick:this.setTopicsSort,
			elements: [
				{type:'header', text: t.funcs.txt('topics_sortdir_setting')},
				{type:'radio', value:'asc', text:t.funcs.txt('topics_sortdir_asc')},
				{type:'radio', value:'desc', text:t.funcs.txt('topics_sortdir_desc')}
			]
		});

		this.topicsSortDir.$body.addClass('settings-group');
		this.topicsSortDir.placeTo(this.ui.$settingsDropdown);

		this.sortDefaults = {
			updated:'desc',
			created:'desc',
			name:'asc'
		}

		// панель поиска
		this.createSearchBox();

		this.header.newTopic.on('click', this.newTopic);

		if (!t.user.hasRight('createTopic')) this.header.newTopic.block();


	},

	nullify:function(){
		t.protos.Unit.prototype
			.nullify.apply(this, arguments);

		if (!t.funcs.getCookie('topics_sort_dir')) {
			this.topicsSortDir.setValue(this.sortDefaults.updated);
		}
		this.setTopicsSort();

		t.topics = {};
	},

	subscribe:function(){

		t.connection.subscribe({
			subscriber: this,
			feedName: 'topics',
			feed:{
				feed:'topics',
				filter: t.address.get('search') || '',
				sort: this.state.sort,
				sort_direction: this.state.sortDir
			}
		})
	},

	activate:function(){
		t.protos.Unit.prototype
			.activate.apply(this, arguments);

		this.subscribe();
	},

	setTopicsStyle:function(e){
		var style = $(e.currentTarget).val();
		this.ui.$content.removeClass(this.styleSelect.options.join(' ')).addClass(style);
	},

	setTopicsSort:function(e){
		this.state.sort = this.topicsSort.getValue();
		this.state.sortDir = this.topicsSortDir.getValue();

		if (typeof e != 'undefined') {

			var target = $(e.currentTarget);
			var value = target.val();
			var name = target.attr('name');

			if (name == 'topics_sort') {
				this.topicsSortDir.setValue(this.sortDefaults[value]);
				this.topicsSortDir.setCookie();
			}

			this.nullify();

			t.connection.subscribe(this, 'topics', {
				sort: this.state.sort,
				sort_direction: this.state.sortDir
			})
		}
	},

	createSearchBox:function(){
		var that = this;

		var searchBoxParams = {
			placeholder: t.txt.filter_by_tags,
			css: {
				float: 'left'
			},
			onConfirm: function (tagSet) {
				that.setFilterQuery(tagSet);
			}
		}

		if (t.address.get('search')) {

			JsHttpRequest.query(
				'./backend/service.php',
				{
					action:'get_tags',
					tags:t.address.get('search')
				}, function(result, errors){

					searchBoxParams.tags = result.map(function(val){return val.name});

					that.searchBox = new t.protos.ui.SearchBox(searchBoxParams);
					that.header.$body.prepend(that.searchBox.$body);
				}
			);

		} else {
			this.searchBox = new t.protos.ui.SearchBox(searchBoxParams);
			this.header.$body.prepend(this.searchBox.$body);
		}
	},

	newTopic: function () {
		this.header.newTopic.block();
		t.units.posts.newTopic();

		return false;
	},

	addNode: function (node) {

		if (this.state.sortDir == 'desc') {
			this.ui.$content.prepend(node.$body);
		} else {
			this.ui.$content.append(node.$body);
		}

		return false;
	},

	setFilterQuery: function (tagSet) {
		this.nullify();

		var searchString = tagSet.join('+');

		t.connection.subscribe(this, 'topics', {
			filter: searchString
		});

		if (searchString) {
			t.address.set('search', searchString);
		} else {
			t.address.del('search');
		}
	},

	isClear: function () {
		return t.funcs.isEmptyObject(t.topics);
	},

	parseFeed: function (feed, actionsUsed) {
		this.stopWaitIndication();

		//console.log('actionsUsed (topics parser):', actionsUsed);

		if (feed.topics) this.parseTopics(feed.topics);
	},

	parseTopics: function (topicsList) {

		for (var i in topicsList) {
			var topicData = topicsList[i];
			var existingTopic = t.topics[topicData.id];

			// обрабатываем информацию о непрочитанности

			// Эта логика потребовала размышлений, так что с подробными комментами:
			// если присутсвует последнее сообщение...
			if (topicData.last_id) {
				// и юзер - его автор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
				if (parseInt(topicData.lastauthor_id, 10) == t.user.id) topicData.unread = '0';

				// иначе, если есть только первое сообщение и оно было изменено...
			} else if (topicData.modifier_id && parseInt(topicData.modifier_id, 10) > 0) {
				// и юзер - его редактор - не показывать непрочитанным, кем бы не были остальные создатели/редакторы
				if (parseInt(topicData.modifier_id, 10) == t.user.id) topicData.unread = '0';

				// иначе (есть только первое неотредактированное сообщение)
			} else {
				// не показываем непрочитанность, если юзер - автор.
				if (parseInt(topicData.author_id, 10) == t.user.id) topicData.unread = '0';
			}
			// todo - внимание! в таком случае своё сообщение _отмечается_ непрочитанным, если юзер отредактировал
			// первое сообщение темы и при этом есть последнее сообщение, которое написал не он, даже если оно уже прочитано
			// при этом снять "непрочитанность" с такой темы невозможно, так как в ленте сообщений отсутствуют
			// "непрочитанные" посты, по наведению на которые снимается непрочитанность

			// если в текущем массиве загруженных тем такая уже есть - обновляем существующую
			if (existingTopic) {

				if (topicData.deleted == 1) {

					existingTopic.remove('fast');
					//if (topicData.id == t.sync.curTopic) t.units.posts.unscribe();
					delete(existingTopic);

				} else {
					existingTopic.fill(topicData);
					existingTopic.bump();
				}

				// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
			} else if (!topicData.deleted || topicData.deleted == 0) {

				var topic = t.topics[topicData.id] = new t.protos.TopicNode(topicData);
				this.addNode(topic);
				//if (tProps['new']) topic.loadPosts();
				//ifblur_notify('New Topic: '+topicData.topic_name, topicData.message);
			}
		}

		this.refreshMenu();

		this.contentLoaded = 1;
	}
});