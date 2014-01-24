/**
 * Created with JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 8/7/13
 * Time: 5:37 PM
 * To change this template use File | Settings | File Templates.
 */

t.protos.StateService = function(){
	var that = this;
	t.funcs.bind(this);

	this.stateData = {};
	this.timer = 0;
}

t.protos.StateService.prototype = {
	push:function(object){

		if (this.timer == 0) {
			this.timer = setTimeout(this.flushState, 3000);
		}

		var action = object.action;
		if (!this.stateData[action]) this.stateData[action] = {};

		if (action == 'read_topic') {

			var id = object.id;
			var time = object.time;

			if (!this.stateData[action][id]) this.stateData[action][id] = 0;
			if (time > this.stateData[action][id]) this.stateData[action][id] = time;
		}
	},

	flushState:function(){

		console.log('state flushed to server! data:', this.stateData);

		this.stateData.action = 'batch';

		JsHttpRequest.query('backend/service.php', this.stateData, this.parseResponse)

		clearTimeout(this.timer);
		this.stateData = {};
		this.timer = 0;
	},

	parseResponse:function(result, errors) {
		console.log(result);

		if (result.read_topic) {
			for (var topic_id in result.read_topic) {
				var readTime = t.funcs.sql2stamp(result.read_topic[topic_id]);

				// если "прочитанная" тема присутствует в текущей выборке
				if (t.topics[topic_id]) {
					var topic = t.topics[topic_id];

					var topicMaxTime = topic.data.lastdate ? topic.data.lastdate : topic.data.modified ? topic.data.modified : topic.data.created;

					//console.log('readTime:',readTime);
					//console.log('topicMaxTime:',topicMaxTime, t.funcs.sql2stamp(topicMaxTime), (t.funcs.sql2stamp(topicMaxTime) >= readTime));

					if (t.funcs.sql2stamp(topicMaxTime) <= readTime) topic.markRead();
				}

				// если мы в теме, которую "прочитали"
				if (t.sync.curTopic == topic_id){
					for (var post_id in t.posts){
						var post = t.posts[post_id];

						var postMaxTime = post.data.modified ? post.data.modified : post.data.created;

						if (t.funcs.sql2stamp(postMaxTime) < readTime) post.markRead();
					}
				}


			}
		}
	}
}