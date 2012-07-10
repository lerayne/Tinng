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

    // Импорт стилей через функцию
    incl_css(
        path('styles/main.css'),
        path('styles/design.css')
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
        $env['rootdir'].'libraries/JsHttpRequest.js',
        $env['appdir'].'sources/js/funcs.js',
        $env['appdir'].'skins/'.$cfg['skin'].'/scripts/interface.js',
        $env['appdir'].'sources/js/content.js',
        $env['appdir'].'sources/js/onload.js'
    );
}

require_once $env['appdir'].'skins/'.$cfg['skin'].'/template.php';
