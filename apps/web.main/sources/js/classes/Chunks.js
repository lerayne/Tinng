/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:51 PM
 * To change this template use File | Settings | File Templates.
 */

// единичный чанк
tinng.protos.Chunk = function(element, attrName){
	t.funcs.bind(this);

	switch (typeof element){

		// если подан элемент
		case 'object':
			this.$body = (element instanceof jQuery) ? element : $(element);
			break;

		// если строка...
		case 'string':

			// ... и она в HTML-синтаксисе - создаем этот элемент
			if (  element.indexOf('<') == 0 ) {
				this.$body = $(element);

			} else {
				// ... и она - не в HTML-синтаксисе - создаем див с указанным классом
				this.$body = $('<div class="'+ element +'"></div>')
			}
			break;
	}

	// ищем значимые поля
	var rawFields = this.$body.find('['+ attrName +']');

	// создаем в объекте свойства на каждое значимое поле
	if (rawFields.size() > 0) {
		for (var i = 0; i < rawFields.length; i++) {
			var element = $(rawFields[i]);
			var fieldName = element.attr(attrName);
			this['$'+fieldName] = element;
		}
	}
}

tinng.protos.Chunk.prototype = {

	appendTo:function(element, top) {

		if (typeof top == 'undefined' || top == 'bottom') {
			element.append(this.$body);
		} else {
			element.prepend(this.$body);
		}
	}
}


// Движок кусков HTML, из копий которых собирается страница
tinng.protos.ChunksEngine2 = function (container, chunkAttr, fieldAttr) {
	var that = this;
	t.funcs.bind(this);

	this.collection = {};
	this.chunkAttr = chunkAttr;
	this.fieldAttr = fieldAttr;

	if (typeof container == 'string') container = $('#' + container);

	container.find('[' + chunkAttr + ']').each(this.populate);
	container.remove();
}

tinng.protos.ChunksEngine2.prototype = {

	// заполняет коллекцию
	populate:function (index, element) {
		var $chunk = $(element);
		this.collection[$chunk.attr(this.chunkAttr)] = $chunk;
	},

	// отдает новый чанк
	get:function (name) {

		if (this.collection[name]) {
			var chunk = new t.protos.Chunk(this.collection[name].clone(), this.fieldAttr);
		} else {
			var chunk = new t.protos.Chunk(name, this.fieldAttr);
		}

		return chunk;
	}
}







// Движок кусков HTML, из копий которых собирается страница
tinng.protos.ChunksEngine = function (containerId, chunkAttr) {
	t.funcs.bind(this);

    this.collection = {};
    this.chunkAttr = chunkAttr;

    $('#' + containerId + ' [' + chunkAttr + ']').each(this.populate);
}

tinng.protos.ChunksEngine.prototype = {

    // заполняет коллекцию
    populate:function (index, value) {
        var $chunk = $(value);
        this.collection[$chunk.attr(this.chunkAttr)] = $chunk;
    },

    // желательно использовать этот клонирующий геттер
    get:function (name) {
        return this.collection[name] ? this.collection[name].clone() : $('<div class="' + name + '"></div>');
    }
}
