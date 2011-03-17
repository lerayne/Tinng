<?php
require_once 'php/spikes.php';
require_once 'locale/ru.php';
require_once 'php/classes.php';
require_once 'libraries/DbSimple/Generic.php';
$db = DbSimple_Generic::connect('mysql://nvcg_main:maedanaena84@localhost/nvcg_topictalk');
$db->query('SET NAMES "utf8"');

$db->setErrorHandler('databaseErrorHandler');
$db->setIdentPrefix('jawi_');

// заглушка аутентификации
$user = new User ($db->selectRow(
	'SELECT * FROM ?_users, ?_user_settings
	WHERE usr_hash=? AND ?_users.usr_id = ?_user_settings.user_id'
	, md5('globus')
));

if ($user->use_gravatar)
	$user->avatar = 'http://www.gravatar.com/avatar/'.md5(strtolower($user->email)).'?s=48';
?>
