/**
 * Created by Michael on 23.08.14.
 */

tinng.protos.UserInterface = function (targetWindow) {
	t.funcs.bind(this)

	this.$unitsArea = $('#tinng-units-area');

	this.window = targetWindow;
	this.$window = $(targetWindow);

	// создание юнитов
	t.units.topics = new t.protos.TopicsUnit({
		name:'topics'
	});

	t.units.posts = new t.protos.PostsUnit({
		name:'posts'
	});

	t.units.topics.placeTo(this.$unitsArea);
	t.units.posts.placeTo(this.$unitsArea);
}

tinng.protos.UserInterface.prototype = {
	activateUnit:function(unitName){
		//если юнит есть и он не активен
		if (t.units[unitName] && !t.units[unitName].active){

			this.getActiveUnit().deactivate();

			t.units[unitName].activate();
		}
	},

	getActiveUnit:function(){
		for (var name in t.units) {
			if (t.units[name].active) return t.units[name];
		}

		return {
			deactivate:function(){}
		}
	}
}
