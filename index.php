<?php

// подключение универсального инициализатора (база в нем же)
$rootdir = './';
require_once 'php/initial.php';

// создание переменных окружения
list($e->path, $e->getdata) = explode('?', $GLOBALS['_ENV']['REQUEST_URI']);
$e->useragent = $_SERVER['HTTP_USER_AGENT'];

// установка локали
header ('Content-type:text/html;charset=utf-8;');

// начало работы с интерфейсом
$columns = array(/*'menu',*/ 'topics', 'posts');

// установка режима работы в зависимости от устройства
$display_mode = 'desktop';

if (strpos($e->useragent, 'Android') || strpos($e->useragent, 'Mobile Safari') || $_GET['mode'] == 'iphone')
	$display_mode = 'phone';

$device_path = 'displays/'.$display_mode.'/'.$display_mode.'_';

//работа с сессией
session_start();

// подключение шаблона
require_once $device_path.'template.php';
?>