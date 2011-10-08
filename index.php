<?php

$rootdir = './';
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

session_start();

require_once $device_path.'template.php';
?>