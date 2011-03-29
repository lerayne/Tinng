<?php
require_once 'php/initial.php';

list($path, $getdata) = explode('?', $GLOBALS['_ENV']['REQUEST_URI']);

header ('Content-type:text/html;charset=utf-8;');

$main_offset = 10;
$columns = array('menu', 'topics', 'posts');

$display_mode = 'desktop'; // режим просмотра в зависимости от устройства
$device_path = 'displays/'.$display_mode;

require_once $device_path.'/template.php';
?>