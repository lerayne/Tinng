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

if (function_exists('curl_init')){

	$param[] = 'client_id='.$safecfg['vk_app_id'];
	$param[] = 'client_secret='.$safecfg['vk_secret_key'];
	$param[] = 'code='.$_REQUEST['code'];
	$param[] = 'redirect_uri=http://dev.tinng.net/apps/web.main/vkauth.php';;

	$url = "https://oauth.vk.com/access_token";
	$conn = curl_init($url);

	// Задаем POST вкачестве метода
	curl_setopt($conn, CURLOPT_POST, true);
	// Отправляем поля POST
	curl_setopt($conn, CURLOPT_POSTFIELDS, join('&', $param));
	// Получать результат в строку, а не выводить в браузер
	curl_setopt($conn, CURLOPT_RETURNTRANSFER, true);
	// не проверять SSL сертификат
	curl_setopt ($conn, CURLOPT_SSL_VERIFYPEER, 0);
	// не проверять Host SSL сертификата
	curl_setopt ($conn, CURLOPT_SSL_VERIFYHOST, 0);
	// это необходимо, чтобы cURL не высылал заголовок на ожидание
	curl_setopt ($conn, CURLOPT_HTTPHEADER, array('Expect:'));

	$response = json_decode(curl_exec($conn));

}

//$response = json_decode(@file_get_contents($url));

/*if ($response->error) {
	die('Или какая-то другая обработка ошибки');
} */?>

url: <?= $url?>
<br><br>
<pre>

<? echo print_r($response) ?><br><br>
</pre>