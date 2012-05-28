<?php
/* Подключаемый файл, который входит как в бекенд для XHR, так и в осовной php-скрипт */

require_once $rootdir.'config.php'; //конфигурационный файл
require_once $rootdir.'locale/ru.php'; // языковые файлы
require_once $rootdir.'php/spikes.php'; // типа фреймворк)
require_once $rootdir.'php/classes.php'; // типа классы)
require_once $rootdir.'libraries/DbSimple/Generic.php'; // либа для работы с базой

// установка локали
$e->set_locale('utf-8');

$db = DbSimple_Generic::connect($safecfg['db']);
$db->query('SET NAMES "utf8"');

$db->setErrorHandler('databaseErrorHandler');
$db->setIdentPrefix($safecfg['db_prefix'].'_');

// !! простой логин. потом сделать более секьюрный
$raw_user = $db->selectRow(
	'SELECT * FROM ?_users WHERE
		hash = ?
		AND login = ?
		AND approved = 1
	'
	, $_COOKIE['pass']
	, $_COOKIE['login']
);

// заглушка аутентификации
if ($raw_user != false) $user = new User ($raw_user);

//if ($user->gravatar)
//$user->avatar = 'http://www.gravatar.com/avatar/'.md5(strtolower($user->email)).'?s=48';

?>