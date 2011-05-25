<?php

require_once 'config.php';

require_once 'libraries/JsHttpRequest.php';
ob_start('ob_gzhandler'); // выводим результат в gzip
$req =& new JsHttpRequest("utf-8");

$action = $_REQUEST['action'];

switch ($action):
	
	// стираем файл, который необходим для работы ожидающего цикла
	case 'stop_waiting':
		unlink('data/xhr_session/'.$_REQUEST['file']);
	break;
	
endswitch;

?>
