<?php
/* Подключаемый файл, который входит как в бекенд для XHR, так и в осовной php-скрипт */

$env['platform'] = 'desktop';
if (strpos(strtolower($_SERVER['HTTP_USER_AGENT']), 'mobile')) $env['platform'] = 'mobile';

require_once $env['appdir'].'config.php';
require_once $env['appdir'].'languages/ru.php';

require_once $env['appdir'].'sources/php/classes/Environment.php';
require_once $env['appdir'].'sources/php/classes/User.php';

require_once $env['appdir'].'sources/php/functions.common.php'; // типа фреймворк)
require_once $env['rootdir'].'lib/DbSimple/Generic.php'; // либа для работы с базой
require_once $env['rootdir'].'lib/lessc.inc.php'; // либа для CSS


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
		avatar.param_value as avatar
	FROM ?_users usr

	LEFT JOIN ?_user_settings avatar ON usr.id = avatar.user_id AND avatar.param_key = "avatar"

	WHERE (usr.hash = ? OR usr.hash = ?) AND (usr.login = ? OR usr.email = ?) AND usr.approved = 1
	'
    , md5($_COOKIE['password'])
    , $_COOKIE['hash']
    , $_COOKIE['login']
	, $_COOKIE['login']
);

/*echo "<pre>";
var_dump($raw_user);
echo 'pass:';
var_dump($_COOKIE['password']);
var_dump(md5($_COOKIE['password']));
echo "</pre>";*/

// todo заглушка аутентификации
if (!$raw_user){
	$user->id = 0;
} else $user = new User ($raw_user);

//if ($user->gravatar)
//$user->avatar = 'http://www.gravatar.com/avatar/'.md5(strtolower($user->email)).'?s=48';

?>