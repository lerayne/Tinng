/**
 * Created by Michael on 23.08.14.
 * @include _Unit.js
 */

tinng.protos.TopicsUnit = Class(tinng.protos.MobileUnit, {
	inherit:function(funcName, args){
		t.protos.MobileUnit.prototype[funcName].apply(this, args);
	},

	construct:function(){
		this.inherit('construct', arguments);

		this.header = new t.protos.ui.Panel([
			{type:'LoginControl', label:'login', cssClass:'right'},
			{type:'Button', label:'newTopic', cssClass:'right', icon:'doc_plus_w.png'}
		]);
		this.ui.$header.append(this.header.$body);

		//this.header.newTopic.on('click', this.newTopic);
	},

	nullify:function(){
		this.inherit('nullify', arguments);

		t.topics = {};
	},

	activate:function(){
		this.inherit('activate', arguments)

		this.subscribe();
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

	parseFeed: function (feed, actionsUsed) {
		this.stopWaitIndication();

		//console.log('actionsUsed (topics parser):', actionsUsed);

		if (feed.topics) this.parseTopics(feed.topics);
	},

	parseTopics:function(topicsList){

		console.log('topicsList', topicsList)

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

		this.contentLoaded = 1;
	}
})