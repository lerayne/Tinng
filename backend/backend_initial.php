<?php
/* Подключаемый файл, который входит в бекенд для XHR */

$rootdir = '../';
require_once '../php/initial.php';

function databaseErrorHandler($message, $info) {
    //if (!error_reporting()) return;
    echo "SQL Error: $message<br><br><pre>"; print_r($info); echo "</pre>";
    //exit();
}

list($xhr_id, $xhr_method) = split('-', $_GET['JsHttpRequest']);
$sessid = $_GET['PHPSESSID'];

require_once '../libraries/JsHttpRequest.php';
ob_start('ob_gzhandler'); // выводим результат в gzip
$req =& new JsHttpRequest("utf-8");
?>
