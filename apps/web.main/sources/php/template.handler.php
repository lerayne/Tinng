<?php

$message = $_COOKIE['message'];

function template_title(){
	echo 'Tinng alpha';
}

function path($file){
	global $cfg, $env;
	return (file_exists($env['appdir'].'skins/'.$cfg['skin'].'/'.$file)) ? $env['appdir'].'skins/'.$cfg['skin'].'/'.$file : $env['appdir'].'stock/'.$file;
}

function template_head(){

	global $env, $cfg, $user, $txt, $rex;

	echo '
		<link id="favicon" rel="shortcut icon" type="image/png" href="'. path('/images/favicon.png') .'">
		<!--[if lt IE 9]> <![endif]-->
	';

	/*incl_turbine_css(
		path('styles/main.cssp'),
		path('styles/design.cssp')
	);*/

	// Импорт стилей через функцию
	incl_css(
		path('styles/main.css'),
		path('styles/design.less')
	);

	echo '<link rel="stylesheet" id="lowres_css" type="text/css" href="">';
	echo '<script type="text/javascript" language="JavaScript" src="'.$env['rootdir'].'libraries/jquery-1.7.2.min.js"></script>';

	// импорт переменных из PHP
	echo '
		<script type="text/javascript" language="JavaScript">

		// Убогая заглушка авторизации на клиенте
		userID = '. ($user ? $user->id : 'null') .'
		var txt = {}, cfg = {}, rex = {};
	';

	foreach ($txt as $key => $val) echo "txt['".$key."'] = '".$val."';\n";
	echo "\n";

	foreach ($cfg as $key => $val) echo "cfg['".$key."'] = ". (is_int($val) || is_float($val) ? $val.";\n" : "'".$val."';\n");
	echo "\n";

	foreach ($rex as $key => $val) echo "rex['".$key."'] = ".$val.";\n";
	echo "\n";

	echo '
		</script>
	';

	// Подключение скриптов
	incl_scripts(
		$env['appdir'].'sources/js/jqextend.js',
		$env['rootdir'].'libraries/JsHttpRequest.js',

		$env['appdir'].'sources/js/classes/Class.js',			// наследователь для классов

		$env['appdir'].'sources/js/classes/Tinng.js',			// главный объект-контейнер
		$env['appdir'].'sources/js/classes/Funcs.js',			// простые функции (иногда расширяются ниже)
		$env['appdir'].'sources/js/classes/Address.js',			// работа с хешем адресной строки
		$env['appdir'].'sources/js/classes/Chunks.js',			// движок подшаблонов, встроенных в базовый шаблон
		$env['appdir'].'sources/js/classes/Controls.js',		// абстракция элементов управления
		$env['appdir'].'sources/js/classes/Units.js',			// "вьюпорты", или секции основного интерфейса
		$env['appdir'].'sources/js/classes/Editor.js',			// редактор сообщений
		$env['appdir'].'sources/js/classes/UserInterface.js',	// основной интерфейс
		$env['appdir'].'sources/js/classes/Connection.js',		// ротор
		$env['appdir'].'sources/js/parser.js',					// обработка пришедших от сервера данных
		$env['appdir'].'sources/js/classes/Tag.js',				// тег
		$env['appdir'].'sources/js/classes/Nodes.js',			// блоки (ноды) сообщений

		$env['appdir'].'sources/js/onload.js'
	);
}

require_once $env['appdir'].'skins/'.$cfg['skin'].'/template.php';
