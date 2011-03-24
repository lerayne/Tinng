<?php
/* Подключаемый файл, который входит как в бекенд для XHR, так и в осовной php-скрипт */

require_once 'config.php';
require_once 'php/spikes.php';
require_once 'locale/ru.php';
require_once 'php/classes.php';
require_once 'libraries/DbSimple/Generic.php';

$db = DbSimple_Generic::connect($safecfg['db']);
$db->query('SET NAMES "utf8"');

$db->setErrorHandler('databaseErrorHandler');
$db->setIdentPrefix($safecfg['db_prefix'].'_');

// заглушка аутентификации
$user = new User ($db->selectRow(
	'SELECT * FROM ?_users, ?_user_settings WHERE usr_hash = ? AND usr_id = uset_user'
	, md5('globus')
));

if ($user->use_gravatar)
	$user->avatar = 'http://www.gravatar.com/avatar/'.md5(strtolower($user->email)).'?s=48';
?>
