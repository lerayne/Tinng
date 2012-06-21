<html>
<head>
<script type="text/javascript" src='../libraries/jquery-1.7.2.min.js'></script>
<script type="text/javascript">


// система хранения полей в дом-элементе с прототипом
var createElementConstructor = function (elementName, constructor) {
	return function () {
		var element = document.createElement(elementName);

		if (constructor.prototype) {
			for (var key in constructor.prototype) {
				element[key] = constructor.prototype[key];
			}
		}

		constructor.apply(element, arguments);

		return element;
	};
};

var data = {id:'12', text:'message 12'};

var post = function () {
	this.resize = $.proxy(this, 'resize');

	this.cells = {};
	this.cells.text = document.createElement('div');
	this.cells.text.innerHTML = this.data.text;
	this.setAttribute('id', this.data.id);

	for (i in this.cells) {
		this.appendChild(this.cells[i])
	}

	$(window).resize(this.resize);
};

post.prototype = {
	append2:function () {
		document.body.appendChild(this);
		console.log(this);
	},

	resize:function () {
		console.log(this);
	},

	data:data
};

$(function () {

	var newPost = createElementConstructor('div', post);
	elem = new newPost();

});


/*  Component - наш самописный движок создания компонентов.
 *
 *  параметры, которые можно передавать в структуру элемента:
 *  attrs - объект с аттрибутами
 *  style - объект с параметрами css для тега style
 *  text - текстовая строка, внутренний текст элемента. При наличии дочерних элементов вставляется перед ними
 *  textAfter - то же самое, если вам нужно вставить текст после дочерних элементов
 *  children - вложенный массив дочерних элементов
 *  name - метка, по которой элемент добавляется во внутренний массив named. Также прописывается в аттрибут name
 *	on - объект с перечислением DOM-событий и названиями функций, которые на эти события нужно повесить
 *
 *  при создании события его this всегда будет самим компонентом, первый параметр - jquery-событием, а второй -
 *  тем dom-элементом, на который это событие навесили
 */


var Component = function (elements, callbacks) {

	this.appendTo = $.proxy(this, 'appendTo');
	this.prependTo = $.proxy(this, 'prependTo');
	this.appendBefore = $.proxy(this, 'appendBefore');
	this.appendAfter = $.proxy(this, 'appendAfter');

	this.parse = $.proxy(this, 'parse');

	this.fragment = document.createDocumentFragment();
	this.named = {};
	this.elements = [];
	this.i = 0;
	this.evts = callbacks;

	var i, v, j;
	for (i in elements) {
		this.fragment.appendChild(this.parse(elements[i]));
	}

	/*for (i in this.elements) {
		  v = this.elements[i];

		  for (j in v) if (j != 'element'){
			  console.log(i+' - '+j)
			  v.element.on(j, v[j]);
		  }
	}*/

}

Component.prototype = {

	parse:function (element) {

		var current = this.i++;
		this.elements[current] = {};
		var $element = this.elements[current].element = (element.tag) ? $('<' + element.tag + '>') : $('<div/>');

		var i , funcName;

		if (element.attrs) $element.attr(element.attrs);

		if (element.style) $element.css(element.style);

		if (element.text) $element.append(document.createTextNode(element.text));

		if (element.classes) $element.addClass(element.classes);

		if (element.children)
			for (i in element.children)
				$element.append(this.parse(element.children[i]));

		if (element.textAfter) $element.append(document.createTextNode(element.textAfter));

		if (element.name) {
			this.named[element.name] = $element;
			$element.attr('name', element.name);
		}

		if (element.on) {

			var that = this;

			for (var action in element.on) {
				funcName = element.on[action];
				if (typeof(this.evts[funcName]) == 'function') {

					this.elements[current][action] = this.evts[funcName];

					$element.on(action, function () {
						var $args = $(arguments);
						$args.push($element[0]);
						that.evts[funcName].apply(that, $args);
					});
				}
			}
		}

		return $element[0];
	},

	appendTo:function (elem) {
		$(elem).append(this.fragment);
	},

	prependTo:function (elem) {
		$(elem).prepend(this.fragment);
	},

	appendBefore:function (elem) {
		$(this.fragment).before(elem);
	},

	appendAfter:function (elem) {
		$(this.fragment).after(elem);
	}
}


$(function () {
	comp = new Panel({


	});

	comp.appendTo($('body'));

	console.log(comp)
});

var control = new Control();
control.text = 'asdsad';
control.on('click', handler);


var Button = Class.create({
	'super' : Control
});

var Control = new Class({
	'events':[
		'click', 'closed', 'dayClick'
	],
	'properties':{
		'text':{
			'get':function () {
				return this.$.myInput.value;
			},
			'set':function (value) {
				this.$.myInput.value = value;
			}
		},

		'content' : {
			'set' : function(content){

			}
		}
	},
	'private':{
		'fireClick':function () {
			this.$.fireEvent('click', { 'target':this });
		}
	},

	content:[
		{
			'class' : Control,
			'text' : 'Hello'

		},

		{text:'before', children:[
			{text:'2', name:'inside'},
			{text:'3', on:{click:'onClick'}}
		], textAfter:'after', on:{click:'onClick'}, style:{border:'1px solid #ccc', margin:5, padding:10}, classes:'classOne classTwo'}
	],

	'initialize':function () {
		$(this.$.myInput).click(function () {
			this.$.fireClick();
		});

		this.$.days.each(index, value)
		{
			this.click(function () {
				this.$.fireEvent('dayClick', {'number':value.text() + 0});
			})
		}
	},
	'dispose':function () {

	}
});


var Class = function(object){

	var constructor = function(){
		this.classDefinition
	};

	constructor.prototype.classDefinition = object;

	return constructor;
}

Class.METHOD_MEMBER = 'METHOD_MEMBER';

Class.prototype = {

}



var EditForm = new Class({
	'base' : Control,

	'content' : [
		{
			'class' : Button,
			'text' : 'Сохранить',
			'click' : 'onSaveClick'
		}
	],

	'members' :{
		'onSaveClick' : {
			'type' : Class.METHOD_MEMBER, // = 'METHOD_MEMBER'
			'access' : Class.PUBLIC_ACCESS,
			'function' : function(){

			}
		},


		'text' : {
			'type' : Class.PROPERTY_MEMBER,
			'access' : Class.PUBLIC_ACCESS,
			'getter' : function(){
				return this.$.text;
			},
			'setter' : function(value){
				this.$.text = value;
			}
		}
	}
});



EditForm.members.onSaveClick.type // = METHOD_MEMBER


var form = new EditForm();

form.onSaveClick();

var button1 = new Button();

button1.on('click', handler);


</script>

</head>
<body>


</body>
</html>