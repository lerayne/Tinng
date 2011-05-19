<?

require_once 'php/initial.php';

list($path, $getdata) = explode('?', $GLOBALS['_ENV']['REQUEST_URI']);

header ('Content-type:text/html;charset=utf-8;');

$columns = array(/*'menu',*/ 'topics', 'posts');

$display_mode = 'desktop'; // режим просмотра в зависимости от устройства
if (   strpos($_SERVER['HTTP_USER_AGENT'], 'Android') 
	|| strpos($_SERVER['HTTP_USER_AGENT'], 'Mobile Safari')
	|| $_GET['mode'] == 'iphone'
) $display_mode = 'phone';

$device_path = 'displays/'.$display_mode.'/'.$display_mode.'_';

//ignore_user_abort(true);

$log = fopen('ajax_log.txt', 'w+');
function ex ($log){
	fwrite($log, 'process terminated '.connection_status()."\n");
}
register_shutdown_function("ex", $log);

?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
	"http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title>UC alpha</title>
		
		<link id="favicon" rel="shortcut icon" type="image/png" href="skins/<?= $cfg['skin'] ?>/images/favicon.png">
		<meta content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" name="viewport" />
		
		<style type="text/css">
			
		</style>
		
		<script type="text/javascript" language="JavaScript" src="libraries/JsHttpRequest.js"></script>
		<script type="text/javascript" language="JavaScript" src="libraries/webtoolkit.js"></script>
		<script type="text/javascript" language="JavaScript" src="js/spikes.js"></script>
		
		<script type="text/javascript" language="JavaScript">
			
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

// начинаем экспереметировать с наследованием по варианту 1 (не используем прототип, используем конструтор суперкласса)

function Parent(color){
	this.container = div('container');
	this.container.style.background = color;
	
	//this.container.innerHTML += this.constructor;
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

function testInheritance(){
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

function loadTopics(){
	// AJAX:
	JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

		action: 'load_topics'

	}, function(result, errors) { // что делаем, когда пришел ответ:
		
		Gmaxdate = result['maxdate'];
		
		document.body.appendChild(div('maxdate', null, Gmaxdate));
		
		for (var i in result['data']){ var row = result['data'][i];
			
				document.body.appendChild(div('topic', 'topic_'+row['id'], row['message']));
			
		}
		
	}, true ); // запрещать кеширование
}

function wait(){
	req = new JsHttpRequest();
	req.onreadystatechange = function() { if (req.readyState == 4) {

		document.body.appendChild(div('errors',null, req.responseText));

	}}
	req.open(null, 'ajax_backend.php', true);
	req.send({

		action: 'long_wait_post',
		maxdate: sql2stamp(Gmaxdate)

	});
}

function stop(){
	req.abort();
}

window.onload = function(){
	//testInheritance();
	
	loadTopics();
}
		</script>
		
		<style type="text/css">
			
			.topic {
				padding: 4px;
				border:1px solid green;
			}
			
		</style>

	</head>

	<body>
		
		<div class='controls'>
			
			<input type="button" value="start wait" onclick="wait()" />
			<span class="waiter"></span>
			<input type="button" value="stop wait" onclick="stop()" />
			
		</div>
		
	</body>
</html>