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


// todo - разобраться с этим бредовым решением системы обратного редиректа. Возможно, следует использовать глобальные переменные, или передавать адрес редиректа в гет
//if ($_SERVER["HTTP_REFERER"]) $location = $_SERVER["HTTP_REFERER"];
//else {
$host = 'http://' . $_SERVER["HTTP_HOST"];
$script_addr = $host . $_SERVER['SCRIPT_NAME'];
$location =
$path_parts = explode('/', $_SERVER['REQUEST_URI']);
array_pop($path_parts);
$location = $host . (implode('/', $path_parts)) . '/';

header ("Content-type:text/html;charset=utf-8;");

function redirect_back(){
	global $location;
	header ("location: ". ($_SERVER["HTTP_REFERER"] ? $_SERVER["HTTP_REFERER"] : 'http://'.$_SERVER["HTTP_HOST"]).$_POST['lochash']);
}


// Получение token
$param[] = 'client_id='.$safecfg['vk_app_id'];
$param[] = 'client_secret='.$safecfg['vk_secret_key'];
$param[] = 'code='.$_REQUEST['code'];
$param[] = 'redirect_uri=' . $script_addr;

$response = curl("https://oauth.vk.com/access_token", $param, 'json');

if ($response['error']) {

	setcookie('message', $response['error'], 0, '/');

	redirect_back();

} elseif ($response['access_token']) {

	$param = array();
	$param[] = 'uid='.$response['user_id'];
	$param[] = 'access_token='.$response['access_token'];
	$param[] = 'fields=screen_name,bdate,timezone,photo,photo_medium,';

	$user_data = curl("https://api.vk.com/method/users.get", $param, 'json');
	$user_data = $user_data['response'][0];

	// формируем новые данные
	$new_user['login'] = 'vk' . $user_data['uid'];
	$new_user['email'] = 'vk' . $user_data['uid']. '@nomail';
	$new_user['hash'] = $response['access_token'];
	$new_user['display_name'] = $user_data['first_name'].' '.$user_data['last_name'];
	$new_user['approved'] = 1;
	$new_user['source'] = 'vk.com';

	$new_user_settings['param_key'] = 'avatar';
	$new_user_settings['param_value'] = $user_data['photo'];

	// проверяем наличие такого юзера в базе
	$user_exists = $db->selectRow(
		'SELECT * FROM ?_users WHERE login = ? OR email = ?'
		, $new_user['login']
		, $new_user['email']
	);

	// если такой пользователь есть
	if ($user_exists) {

		$new_user['id'] = $user_exists['id'];

		// обновляем юзера
		// todo - обновлять и другие данные (решить какие)
		$db->query(
			'UPDATE ?_users SET hash = ? WHERE id = ?d'
			, $new_user['hash']
			, $new_user['id']
		);

	} else {

		// добавляем запись о нем в базу
		$new_user['reg_date'] = date('Y-m-d H:i:s');

		$new_id = $db->query(
			'INSERT INTO ?_users (?#) VALUES (?a)', array_keys($new_user), array_values($new_user)
		);

		$new_user_settings['user_id'] = $new_user['id'] = $new_id;

		$db->query(
			'INSERT INTO ?_user_settings (?#) VALUES (?a)', array_keys($new_user_settings), array_values($new_user_settings)
		);

		// Пишем админу
		mail($safecfg['admin_email'], 'Новый пользователь Tinng', $new_user['display_name'].', http://vk.com/id'.$user_data['uid'] , "From:".$cfg['instance_name']." <".$safecfg['instance_email'].">");
	}

	// логиним юзера
	$time = time()+($response['expires_in']*1); // запоминаем на время актуальности токена
	setcookie('pass', $new_user['hash'], $time, '/');
	setcookie('login', $new_user['login'], $time, '/');
	setcookie('user', $new_user['id'], $time, '/');

	redirect_back();
}

?>
<!--<pre>

<?/* echo print_r($_SERVER) */?><br><br>
<?/* echo var_dump($response) */?><br><br>
<?/* echo var_dump($param) */?><br><br>
<?/* echo var_dump($user_data) */?><br><br>
</pre>-->