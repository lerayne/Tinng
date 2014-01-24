<?php

$message = $_COOKIE['message'];

function template_title() {
	echo 'Tinng alpha';
}

function path($file) {
	global $cfg, $env, $e;

	$skinned_path = $env['appdir'] . 'skins/' . $cfg['skin'] . '/' . $file;
	$stock_path = $env['appdir'] . 'stock/' . $file;

	return (file_exists($skinned_path)) ? $skinned_path : $stock_path;
}

function import_php_str($str) {

	$str = str_replace("\r", '', $str);
	$str = str_replace("\n", ' ', $str);

	return $str;
}

function template_head() {

	global $env, $cfg, $user, $txt, $rex, $e;

	echo '
		<link id="favicon" rel="shortcut icon" type="image/ico" href="' . path('/images/favicon.ico') . '">
		<!--[if lt IE 9]> <![endif]-->
	';

	// Импорт стилей через функцию
	incl_css(
		path('styles/main.css'),
		path('styles/design.less')
	);

	echo '<link rel="stylesheet" id="lowres_css" type="text/css" href="">';

	$agent = $_SERVER['HTTP_USER_AGENT'];

	if (strpos($agent, 'MSIE 8.0') || strpos($agent, 'MSIE 7.0') || strpos($agent, 'MSIE 6.0')) {
		echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'libraries/modernizr.js"></script>';
		echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'libraries/jquery-1.x.js"></script>';
		echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'libraries/es5-shim.min.js"></script>';
	} else {
		echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'libraries/jquery-2.x.js"></script>';
	}

	// импорт переменных из PHP
	echo '
		<script type="text/javascript" language="JavaScript">

		// Убогая заглушка авторизации на клиенте
		userID = ' . ($user ? $user->id : 'null') . '
		var appPath = "'. $env['appdir'] .'";
		var rootPath = "'. $env['rootdir'] .'";
		var txt = {}, cfg = {}, rex = {};
	';

	foreach ($txt as $key => $val) echo "txt['" . $key . "'] = '" . import_php_str($val) . "';\n";
	echo "\n";

	foreach ($cfg as $key => $val) echo "cfg['" . $key . "'] = " . (is_int($val) || is_float($val) ? $val . ";\n" : "'" . $val . "';\n");
	echo "\n";

	foreach ($rex as $key => $val) echo "rex['" . $key . "'] = " . $val . ";\n";
	echo "\n";

	echo '
		</script>
	';

	// Подключение скриптов
	incl_scripts(
		// тут важен порядок
		$env['appdir'] . 'sources/js/jqextend.js', 				// мои расширения jq (в основном самопис)
		$env['rootdir'] . 'libraries/JsHttpRequest.js',			// сторонняя библиотека работы с XHR
		$env['appdir'] . 'sources/js/classes/Class.js',			// наследователь для классов + кроссбраузерный bind
		$env['appdir'] . 'sources/js/tinng_init.js',			// главный объект-контейнер
		$env['appdir'] . 'sources/js/classes/Funcs.js',			// простые функции (иногда расширяются ниже)

		//$env['appdir'] . 'sources/js/classes/KeyListener.js',	// обработка горячих клавиш

		// todo - придумать механизм реквайринга js-исходников
		//порядок загрузки этих классов непринципиален
		$env['appdir'] . 'sources/js/classes/StateService.js',	// служба второчтепенной связи с сервером
		$env['appdir'] . 'sources/js/classes/Validator.js',		// проверка данных форм (из anrom)
        $env['appdir'] . 'sources/js/classes/User.js',			// пользователь
		$env['appdir'] . 'sources/js/classes/UserWatcher.js',	// управление онлайн-статусом
        $env['appdir'] . 'sources/js/classes/Address.js',		// работа с хешем адресной строки
		$env['appdir'] . 'sources/js/classes/Chunks.js',		// движок подшаблонов, встроенных в базовый шаблон

		// абстракция элементов управления
		$env['appdir'] . 'sources/js/classes/controls/Button.js',
		$env['appdir'] . 'sources/js/classes/controls/Field.js',
		$env['appdir'] . 'sources/js/classes/controls/Panel.js',
		$env['appdir'] . 'sources/js/classes/controls/SearchBox.js',
		$env['appdir'] . 'sources/js/classes/controls/Tag.js',

		$env['appdir'] . 'sources/js/classes/Units.js',			// "вьюпорты", или секции основного интерфейса
		$env['appdir'] . 'sources/js/classes/Editor.js',		// редактор сообщений
		$env['appdir'] . 'sources/js/classes/UserInterface.js', // основной интерфейс
		$env['appdir'] . 'sources/js/classes/Rotor.js', 		// соединение с сервером данных
		$env['appdir'] . 'sources/js/parser.js', 				// обработка пришедших от сервера данных
		$env['appdir'] . 'sources/js/classes/Nodes.js', 		// блоки (ноды) сообщений

		$env['appdir'] . 'sources/js/classes/connection/Connection.js', 				// враппер соединения
		$env['appdir'] . 'sources/js/classes/connection/engines/XHRShortPoll.js', 		// враппер соединения
		$env['appdir'] . 'sources/js/parser2.js', 										// обработка пришедших от сервера данных

		// этот файл всегда подгружается последним
		$env['appdir'] . 'sources/js/onload.js'
	);

	echo '<meta property="og:image" content="'. $e->full_app_path .'stock/images/social_big.png">';
}

require_once $env['appdir'] . 'skins/' . $cfg['skin'] . '/template.php';
