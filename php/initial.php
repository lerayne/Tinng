<?php
/* Подключаемый файл, который входит как в бекенд для XHR, так и в осовной php-скрипт */

require_once 'config.php';
require_once 'locale/ru.php';
require_once 'php/spikes.php';
require_once 'php/classes.php';
require_once 'libraries/DbSimple/Generic.php';

$db = DbSimple_Generic::connect($safecfg['db']);
$db->query('SET NAMES "utf8"');

$db->setErrorHandler('databaseErrorHandler');
$db->setIdentPrefix($safecfg['db_prefix'].'_');

// !! простой логин. потом сделать более секьюрный
$raw_user = $db->selectRow(
	'SELECT * FROM ?_users WHERE
		hash = ?
		AND login = ?
		AND approved = 1'
	, $_COOKIE['pass']
	, $_COOKIE['login']
);

// заглушка аутентификации
if ($raw_user != false) $user = new User ($raw_user);

//if ($user->gravatar)
//$user->avatar = 'http://www.gravatar.com/avatar/'.md5(strtolower($user->email)).'?s=48';
?>
