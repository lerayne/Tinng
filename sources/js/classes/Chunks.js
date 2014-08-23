/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:51 PM
 * To change this template use File | Settings | File Templates.
 *
 * Chunk - универсальный обработчик небольших html-шаблонов. Общий принцип работы: на обработку подается фрагмент html
 * (в виде текста, или готового объекта), движок анализирует, есть ли в нем элементы с указанным аттрибутом (attrName)
 * и выдает объект, в котором параметры, начинающиеся со знака $ - это jQuery-эелементы. $body - коневой элемент, все
 * остальные формируются из значений аттрибутов attrName.
 * Если в качестве element передана строка, начинающаяся не с "<" - создается див с классом element
 *
 * Примеры использования:
 * var template = new t.protos.Chunk('<div><button data-field="action">Go!</button></div>', 'data-field');
 * На выходе:
 * template.$body - <div>
 * template.$action - <button>
 *
 * var clear = new t.protos.Chunk('clearfix');
 * На выходе:
 * clear.$body - <div class="clearfix"></div>
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
	if (typeof attrName != 'undefined'){

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

/**
 * ChunksEngine - движок коллекции Chunk-объектов. Подразумевает, что где-то в загруженном шаблоне есть объект container,
 * содержащий шаблоны, опознаваемые по наличию аттрибута chunkAttr, значение которого является именем шаблона.
 * fieldAttr - имя поля, передаваемое при создании чанка в качестве второго аттрибута. Основной метод - get - выдает
 * клон чанка, хранящегося в памяти экземпляра ChunksEngine.
 * При отсутствии в коллекции чанка с таким именем выдаст div с указанным именем в качестве класса.
 */

// Движок кусков HTML, из копий которых собирается страница
tinng.protos.ChunksEngine = function (container, chunkAttr, fieldAttr) {
	var that = this;
	t.funcs.bind(this);

	this.collection = {};
	this.chunkAttr = chunkAttr;
	this.fieldAttr = fieldAttr;

	if (typeof container == 'string') container = $('#' + container);

	container.find('[' + chunkAttr + ']').each(this.populate);
	container.remove();
}

tinng.protos.ChunksEngine.prototype = {

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