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
			this.timer = setTimeout(this.flushState, 5000);
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

		clearTimeout(this.timer);
		this.stateData = {};
		this.timer = 0;
	}
}