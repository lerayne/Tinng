<?php

$message = $_COOKIE['message'];

function template_title() {
	global $cfg;
	echo $cfg['instance_name'];
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
		echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'lib/modernizr.js"></script>';
		echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'lib/jquery-1.x.js"></script>';
		echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'lib/es5-shim.min.js"></script>';
	} else {
		echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'lib/jquery-2.x.js"></script>';
	}

	echo '<script type="text/javascript" language="JavaScript" src="' . $env['appdir'] . 'lib/ckeditor/ckeditor.js"></script>';
	//echo '<script type="text/javascript" language="JavaScript" src="' . $env['appdir'] . 'lib/ckeditor/adapters/jquery.js"></script>';
	echo '<script type="text/javascript" language="JavaScript" src="' . $env['rootdir'] . 'lib/jquery-ui-1.10.4.custom.min.js"></script>';

	// импорт переменных из PHP
	echo '
		<script type="text/javascript" language="JavaScript">

		// Убогая заглушка авторизации на клиенте
		importedUser = ' . json_encode($user) . ';
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

	$debug = !$cfg['production'];

	// Загрузка скриптов (теперь зависимости прописываются в самих файлах!)
	get_js(Array(

		get_script($env['appdir'].'sources/js', 'jqextend.js', $debug),
		//get_script($env['rootdir'], 'libraries/JsHttpRequest.js', $debug),
		get_script($env['appdir'].'sources/js', 'tinng_init.js', $debug),
		get_script($env['appdir'].'sources/js', 'classes/Funcs.js', $debug), // todo - возможно стоит вынести в отдельный объект, чтобы не путать иерархию

		get_script($env['appdir'].'sources/js', 'onload.js', $debug),

	), $debug);

	echo '<meta property="og:image" content="'. $e->full_app_path .'stock/images/social_big.png">';
}

require_once $env['appdir'] . 'skins/' . $cfg['skin'] . '/template.php';

echo '<pre>';
var_dump($GLOBALS['debug']);
echo '</pre>';
