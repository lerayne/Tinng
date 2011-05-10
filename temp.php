<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
	"http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title>UC alpha</title>
		
		<link id="favicon" rel="shortcut icon" type="image/png" href="skins/<?= $cfg['skin'] ?>/images/favicon.png">
		<meta content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" name="viewport" />
		
		<style type="text/css">
			
		</style>
		
		<script type="text/javascript" language="JavaScript">

// Конструтор классов, спасибо Riim (javascript.ru)
var Class = (function() {

	var extend = Object.extend = function(self, obj) {
		if (self == null) self = {};
		for (var key in obj) self[key] = obj[key];
		return self;
	}

	return function(parent, declaration) {
		
		var Klass = function() {
			this.initialize.apply(this, arguments);
		}
		
		if (typeof parent == 'function') {
			function F(){}
			F.prototype = parent.prototype;
			Klass.prototype = new F();
		} else {
			if (parent != null) declaration = parent;
			parent = Object;
		}

		extend(Klass.prototype, declaration).initialize || (Klass.prototype.initialize = Function.blank);
		Klass.superclass = parent;
		Klass.prototype.superclass = parent.prototype;
		return Klass.prototype.constructor = Klass;
	};

})();

/*
var Class = function(parent, declaration) {
	
	var extend = Object.extend = function(self, obj) {
		if (self == null) self = {};
		for (var key in obj) self[key] = obj[key];
		return self;
	}
	
	var Klass = function() {
		this.initialize.apply(this, arguments);
	}
	
	if (typeof parent == 'function') {
		function F(){}
		F.prototype = parent.prototype;
		Klass.prototype = new F();
	} else {
		if (parent != null) declaration = parent;
		parent = Object;
	}
	
	extend(Klass.prototype, declaration).initialize || (Klass.prototype.initialize = Function.blank);
	Klass.$super = parent;
	Klass.prototype.$super = parent.prototype;
	return Klass.prototype.constructor = Klass;

}
*/
var Pa = Class({
	initialize: function(color) {
		this.populate(color);
	},

	populate: function(color) {
		this.container = div('container', 'empty');
		this.container.style.background = color;
	}
});

var Ci = Class(Pa, {
	populate: function(color) {
		Pa.prototype.populate.call(this, color);
		this.header = div('header', 'Заголовок!');
		this.container.appendChild(this.header);
	}
});

var GCi = Class(Ci, {
	populate: function(color) {
		Ci.prototype.populate.call(this, color);
		this.message = div('messge', 'Сообщение!');
		this.container.appendChild(this.message);
	}
});

			
// та самая extend		
function extend(Parent, Child) {
	var F = function() { }
	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
	Child.superclass = Parent.prototype;
}

// функция создания дива с классом и содержимым
function div(className, content){
	var elem = document.createElement('DIV');
	if (className) elem.className = className;
	if (content) elem.innerHTML = content;
	return elem;
}

// начинаем экспереметировать с наследованием по варианту 1 (не используем прототип, используем конструтор суперкласса)

function Parent(color){
	this.container = div('container');
	this.container.style.background = color;
	
	this.container.innerHTML += this.constructor;
}

extend(Parent, Child = function(){
	Child.superclass.constructor.apply(this, arguments);
	
	this.header = div('header', 'Заголовок!');
	this.container.appendChild(this.header);
});

extend(Child, GrandChild = function(){
	GrandChild.superclass.constructor.apply(this, arguments);
	
	this.message = div('messge', 'Сообщение!');
	this.container.appendChild(this.message);
});

// вариант 2, все свойства и методы добавляются через прототип: 

function P(color){
	this.populate(color);
}
P.prototype.populate = function(color){
	this.container = div('container', 'empty');
	this.container.style.background = color;
}

extend(P, C = function(color){
	this.populate(color);
});
C.prototype.populate = function(){
	P.prototype.populate.apply(this, arguments);
	this.header = div('header', 'Заголовок!');
	this.container.appendChild(this.header);
}

extend(C, GC = function(color){
	this.populate(color);
});
GC.prototype.populate = function(){
	C.prototype.populate.apply(this, arguments);
	this.message = div('messge', 'Сообщение!');
	this.container.appendChild(this.message);
}

 // func по прежнему недоступна, сама функция работает потому что все действия затолканы в конструктор

window.onload = function(){
	document.body.appendChild(new Parent('#7777FF').container); // выводит только "empty"
	document.body.appendChild(new Child('#9999FF').container); // выводит "empty" и "Заголовок!"
	document.body.appendChild(new GrandChild('#BBBBFF').container); // "empty", "Заголовок!" и "Сообщение!"
	
	document.body.appendChild(new P('#FF7777').container); // выводит только "empty"
	document.body.appendChild(new C('#FF9999').container); // работает нормально, выводит только empty
	document.body.appendChild(new GC('#FFbbbb').container); // func не наследуется
	
	document.body.appendChild(new Pa('#229922').container); // выводит только "empty"
	document.body.appendChild(new Ci('#55BB55').container); // выводит "empty" и "Заголовок!"
	document.body.appendChild(new GCi('#77EE77').container); // "empty", "Заголовок!" и "Сообщение!"
}
		</script>

	</head>

	<body>
		
	</body>
</html>