/**
 * Created by M. Yegorov on 1/27/14.
 *
 * @include apps/web.main/sources/js/classes/Class.js
 */

tinng.protos.Node = Class({

	initialize:function (data, chunkName, addCells) {
		this.construct(data, chunkName, addCells);
		this.fill(data);
	},

	construct:function (data, chunkName, addCells) {
		var that = this;
		t.funcs.bind(this, ['markRead', 'pushReadState', 'toggleMenu', 'hideMenu']);

		this.$body = t.chunks.get(chunkName || 'node');

		// создаем поля главного объекта на основе данных
		this.data = data;
		this.id = parseInt(data.id);

		// заполняем коллекцию cells на основе названий полей
		var cells = [

			'infobar',
			'created',
			'author',
			'id',
			'message',
			'controls',
			'controls2',
			'menuBtn',
			'tags'

		].concat(addCells || []);

		this.cells = {};
		for (var i in cells) this.cells['$' + cells[i]] = this.$body.find('[data-cell="' + cells[i] + '"]');

		// универсальные управления событиями
		// todo - закончить
		this.cells.$controls.on('click', '.button', function(){
			console.log('hide')
		});
		this.cells.$menuBtn.on('click', this.toggleMenu);
		this.$body.on('click mouseleave', this.hideMenu);



		// заполняем неизменные данные, присваеваемые единожды
		this.$body.attr('id', chunkName + '_' + data.id);
		this.$body.attr('data-number', data.id);
		this.cells.$message.addClass('message_' + data.id);
		if (!t.cfg.production) this.cells.$id.text(data.id);
	},

	// заполнить данными
	fill:function (data) {
		var that = this;

		this.data = data;

		// общие поля
		this.cells.$message.html(data.message);
		this.cells.$created.text(data.modified ? t.txt.modified + data.modified : data.created);
		this.cells.$author.text(data.author);

		// вбиваем теги
		//todo: сейчас теги при каждом филле обнуляются и вбиваются заново. непорядок
		if (data.tags) {
			this.cells.$tags.children().remove();

			data.tags.forEach(function(val, i){

				var tag = new t.protos.ui.Tag(val, {
					bodyClick:function(){
						t.units.topics.searchBox.addTagToSelection(val.name)
					}
				})
				that.cells.$tags.append(tag.$body);
			})

			this.cells.$tags.show();
		}
	},

	updateMenu:function(){
		// если в меню нет кнопок - спрятать стрелочку
		if (!this.cells.$controls.find('.button-body').not('.none').size()) this.cells.$menuBtn.hide();
		else this.cells.$menuBtn.show();
	},

	show:function (start) {
		this.$body[0].scrollIntoView(start);
	},

	markRead:function(){
		this.$body.removeClass('unread');
		this.data.unread = '0';
	},

	markUnread:function(){
		this.$body.addClass('unread');
		this.data.unread = '1';
	},

	toggleMenu:function(){
		if (this.cells.$controls.children().size()){
			this.cells.$controls.toggle();
		}
		return false;
	},

	hideMenu:function(){
		this.cells.$controls.hide();
		return false;
	}
});
