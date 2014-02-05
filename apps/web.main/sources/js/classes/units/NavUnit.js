/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include _Unit.js
 */

tinng.protos.NavUnit = Class(tinng.protos.Unit, {

	construct: function () {
		t.protos.Unit.prototype
			.construct.apply(this, arguments);

		this.header = new t.protos.ui.Panel([
			{type:'Field', label:'title', cssClass:'title'}
		]);

		this.header.title.$body.text(t.txt.title_all_tags);
		this.ui.$header.append(this.header.$body);

		this.objectList = {};

		this.$tagArea = t.chunks.get('tagArea').$body;
		this.$tagArea.appendTo(this.ui.$content);

		this.activate();
	},

	activate:function(){
		t.protos.Unit.prototype
			.activate.apply(this, arguments);

		t.connection.subscribe(this, 'tags', {
			feed:'tags'
		});
	},

	parseFeed:function(data){
		if (data.tags) this.parseTags(data.tags);
	},

	parseTags:function(tags){
		var that = this;

		tags.forEach(function(tagData, i){

			if (!that.objectList[tagData.id]) {
				that.objectList[tagData.id] = new t.protos.ui.Tag(tagData, {
					bodyClick:function(){
						t.units.topics.searchBox.addTagToSelection(tagData.name)
					}
				});
				that.objectList[tagData.id].$body.appendTo(that.$tagArea);
			}
		});
	}
})
