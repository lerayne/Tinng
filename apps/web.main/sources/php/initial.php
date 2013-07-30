<?php
/* Подключаемый файл, который входит как в бекенд для XHR, так и в осовной php-скрипт */

require_once $env['appdir'].'config.php';
require_once $env['appdir'].'languages/ru.php';

require_once $env['appdir'].'sources/php/classes/Environment.php';
require_once $env['appdir'].'sources/php/classes/User.php';

require_once $env['appdir'].'sources/php/functions.common.php'; // типа фреймворк)
require_once $env['rootdir'].'libraries/DbSimple/Generic.php'; // либа для работы с базой
require_once $env['rootdir'].'libraries/lessc.inc.php'; // либа для CSS


$e = new Environment();

// установка локали
$e->set_locale('utf-8');

$db = DbSimple_Generic::connect($safecfg['db']);

$db->query('SET NAMES "utf8"');

$db->setErrorHandler('databaseErrorHandler');
$db->setIdentPrefix($safecfg['db_prefix'].'_');

// !! todo простой логин. потом сделать более секьюрный
$raw_user = $db->selectRow('
	SELECT
		usr.id,
		usr.login,
		usr.display_name,
		usr.email,
		usr.hash,
		usr.reg_date,
		usr.source,
		portrait.param_value as portrait
	FROM ?_users usr

	LEFT JOIN ?_user_settings portrait ON usr.id = portrait.user_id AND portrait.param_key = "avatar"

	WHERE usr.hash = ? AND (usr.login = ? OR usr.email = ?) AND usr.approved = 1
	'
    , $_COOKIE['pass']
    , $_COOKIE['login']
	, $_COOKIE['login']
);

// todo заглушка аутентификации
if (!$raw_user){
	$user->id = 0;
} else $user = new User ($raw_user);

//if ($user->gravatar)
//$user->avatar = 'http://www.gravatar.com/avatar/'.md5(strtolower($user->email)).'?s=48';

?>