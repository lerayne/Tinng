/**
 * Created by M. Yegorov on 1/27/14.
 */

tinng.protos.TopicsUnit = Class(tinng.protos.Unit, {

	construct: function () {
		var that = this;
		t.funcs.bind(this, ['newTopic'])

		t.protos
			.Unit.prototype
			.construct.apply(this, arguments);

		this.header = new t.protos.ui.Panel([
			{type:'Button', label:'newTopic', cssClass:'right', icon:'doc_plus_w.png', text:tinng.txt.new_topic}
		]);
		this.$header.append(this.header.$body);

		// панель поиска
		this.createSearchBox();

		this.header.newTopic.on('click', this.newTopic);

		if (!t.user.hasRight('createTopic')) this.header.newTopic.block();
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
		//todo - реализация похожа на node.bump - подумать что с этим можно сделать

		switch (t.sync.topicSort) {

			// сортировка по последнему обновлению
			case 'updated':

				if (t.sync.tsReverse) {
					this.$content.prepend(node.$body);
				} else {
					this.$content.append(node.$body);
				}

				break;
		}

		return false;
	},

	setFilterQuery: function (tagSet) {
		this.clear();

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

	clear: function () {
		t.protos.Unit.prototype['clear'].apply(this, arguments);

		t.topics = {};
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

				if (topicData.deleted) {

					existingTopic.remove('fast');
					//if (topicData.id == t.sync.curTopic) t.funcs.unloadTopic();
					delete(existingTopic);

				} else {
					existingTopic.fill(topicData);
					existingTopic.bump();
				}

				// если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
			} else if (!topicData.deleted) {

				var topic = t.topics[topicData.id] = new t.protos.TopicNode(topicData);
				this.addNode(topic);
				//if (tProps['new']) topic.loadPosts();
				//ifblur_notify('New Topic: '+topicData.topic_name, topicData.message);
			}
		}

		this.contentLoaded = 1;
	}
});