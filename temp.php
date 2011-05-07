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
	this.container = div('container', 'empty');
	this.container.style.background = color;
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

function P(){}
P.prototype = {
	populate: function(color){
		this.container = div('container', 'empty');
		this.container.style.background = color;
	}
}

function C(color){
	this.populate(color);
}
C.prototype = {
	func: function(color){
		this.populate(color);
		this.header = div('header', 'Заголовок!');
		this.container.appendChild(this.header);
	}
}
extend(P, C);

// эта функция 
function GC(color){
	this.func(color);
	
	this.message = div('messge', 'Сообщение!');
	this.container.appendChild(this.message);
}
extend(C, GC);

window.onload = function(){
	document.body.appendChild(new Parent('#7777FF').container); // выводит только "empty"
	document.body.appendChild(new Child('#9999FF').container); // выводит "empty" и "Заголовок!"
	document.body.appendChild(new GrandChild('#BBBBFF').container); // "empty", "Заголовок!" и "Сообщение!"
	
	// document.body.appendChild(new P('#77FF77').container); // вообще ничего не выводит, потому что populate не вызывается
	document.body.appendChild(new C('#99FF99').container); // работает нормально, выводит только empty
	document.body.appendChild(new GC('#BBFFBB').container); // func не наследуется
}
		</script>

	</head>

	<body>
		
	</body>
</html>