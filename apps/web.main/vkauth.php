<?php
/**
 * Created by JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 7/15/13
 * Time: 7:03 PM
 * To change this template use File | Settings | File Templates.
 */

$env = array();
$env['appdir'] = '';
$env['rootdir'] = '../../';

require_once $env['appdir'].'config.php';
require_once $env['appdir'].'sources/php/functions.common.php';
require_once $env['appdir'].'languages/ru.php';
require_once $env['rootdir'].'libraries/DbSimple/Generic.php';

$db = DbSimple_Generic::connect($safecfg['db']);
$db->query('SET NAMES "utf8"');
$db->setIdentPrefix($safecfg['db_prefix'].'_');

header ("Content-type:text/html;charset=utf-8;");

// Получение token
$param[] = 'client_id='.$safecfg['vk_app_id'];
$param[] = 'client_secret='.$safecfg['vk_secret_key'];
$param[] = 'code='.$_REQUEST['code'];
$param[] = 'redirect_uri=http://dev.tinng.net/apps/web.main/vkauth.php';;

$response = curl("https://oauth.vk.com/access_token", $param, 'json');

if ($response['error']) {

	die('Ошибка');

} elseif ($response['access_token']) {

	$param = array();
	$param[] = 'uid='.$response['user_id'];
	$param[] = 'access_token='.$response['access_token'];
	$param[] = 'fields=screen_name,bdate,timezone,photo,photo_medium,';

	$user_data = curl("https://api.vk.com/method/users.get", $param, 'json');
}

?>
<pre>
<? echo var_dump($response) ?><br><br>
<? echo var_dump($param) ?><br><br>
<? echo var_dump($user_data) ?><br><br>
</pre>