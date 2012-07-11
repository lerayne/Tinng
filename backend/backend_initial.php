<?php
/* Подключаемый файл, который входит в бекенд для XHR */

$rootdir = '../';
require_once '../php/initial.php';

function databaseErrorHandler($message, $info) {
    //if (!error_reporting()) return;
	//ob_start();
	echo "SQL Error: $message<br><br><pre>"; print_r($info); echo "</pre>";
	//$result['exceptions'][] = ob_get_contents();
	//ob_end_clean();
	exit();
}

list($xhr_id, $xhr_method) = split('-', $_GET['JsHttpRequest']);
$sessid = $_GET['PHPSESSID'];

require_once '../libraries/JsHttpRequest.php'; // либа для аякса

if (!ini_get('zlib.output_compression')) ob_start('ob_gzhandler'); // выводим результат в gzip

$req =& new JsHttpRequest($e->locale); //"utf-8"
?>
