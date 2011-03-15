<?php
require_once 'initial.php';

list($path, $getdata) = explode('?', $GLOBALS['_ENV']['REQUEST_URI']);

header ('Content-type:text/html;charset=utf-8;');

$main_offset = 10;
$columns = array('menu', 'topics', 'posts');

$view_device = 'full'; // режим просмотра в зависимости от устройства
$view = 'main'; // текущее представление

require_once 'views/'.$view_device.'_'.$view.'_view.php';
?>
