<?php

$env = array();
$env['appdir'] = '';
$env['rootdir'] = '../../';

//error_reporting(E_ALL);

require_once $env['appdir'].'config.php';
require_once $env['appdir'].'sources/php/functions.common.php';
require_once $env['appdir'].'languages/ru.php';
require_once $env['rootdir'].'lib/DbSimple/Generic.php';

$db = DbSimple_Generic::connect($safecfg['db']);
$db->query('SET NAMES "utf8"');
$db->setIdentPrefix($safecfg['db_prefix'].'_');

$message = false;

// todo - разобраться с этим бредовым решением системы обратного редиректа. Возможно, следует использовать глобальные переменные, или передавать адрес редиректа в гет
//if ($_SERVER["HTTP_REFERER"]) $location = $_SERVER["HTTP_REFERER"];
//else {
	$location = 'http://'.$_SERVER["HTTP_HOST"];
	$path_parts = explode('/', $_SERVER['REQUEST_URI']);
	array_pop($path_parts);
	$location .= implode('/', $path_parts);
	$location .= '/';
//}

header ("Content-type:text/html;charset=utf-8;");

function redirect_back(){
	global $location;
	header ("location: ". ($_SERVER["HTTP_REFERER"] ? $_SERVER["HTTP_REFERER"] : 'http://'.$_SERVER["HTTP_HOST"]).$_POST['lochash']);
}

switch ($_REQUEST['action']):

	case 'login':

		$raw = $db->selectRow(
			'SELECT
				id, login, email
			FROM ?_users
			WHERE hash = ? AND approved = 1 AND (login = ? OR email = ?)'
			, md5($_POST['pass'])
			, $_POST['login']
			, $_POST['login']
		);

		if ($raw != false) {

			$time = ($_POST['memorize']) ? time()+(365*24*60*60) : false; // запоминаем на год
			setcookie('pass', md5($_POST['pass']), $time, '/');
			setcookie('login', $raw['login'], $time, '/');
			setcookie('user', $raw['id'], $time, '/');

		} else {
			setcookie('message', 'login_failure', 0, '/');
		}

		redirect_back();

	break;

	case 'logout':

		$user_id = $_COOKIE['user'];

		if ($user_id != 0) {
			$db->query('UPDATE ?_users SET status = "offline" WHERE id = ?d', $user_id);
		}

		setcookie('pass', '', 0, '/');
		setcookie('login', '', 0, '/');
		setcookie('user', '', 0, '/');

		redirect_back();

	break;



	case 'register':

//		setcookie('logdata', base64_encode(serialize($_POST)), 0, '/');

//		$debug = 1;

		if (!preg_match($rex['pass'], $_POST['pass1'])) $message = 'wrong_password';
		if ($_POST['pass1'] != $_POST['pass2']) $message = 'password_mismatch';
		if (!preg_match($rex['email'], $_POST['email'])) $message = 'wrong_email';
		if (!preg_match($rex['login'], $_POST['login'])) $message = 'wrong_login';
		if ($_POST['quiz'] != trim($quiz[$_POST['number']*1]['answer'])) $message = 'wrong_antibot';

		$raw = $db->selectRow(
			'SELECT * FROM ?_users WHERE login = ? OR email = ?'
			, $_POST['login']
			, $_POST['email']
		);
		if ($raw) $message = 'user_exists';

		if (!$message):

			$new_row = Array(
				'login' => $_POST['login'],
				'hash' => md5($_POST['pass1']),
				'email' => $_POST['email'],
				'reg_date' => date('Y-m-d H:i:s')
			);

			if ($debug) {

				$appr_link = $location.'login.php?action=approve&u=1&token='
					.md5($_POST['login'].'zerso'.md5($_POST['pass1']).'b0t'.$_POST['email']);

			} else {

				$unum = $db->query(
					'INSERT INTO ?_users (?#) VALUES (?a)', array_keys($new_row), array_values($new_row)
				);

				$appr_link = $location.'login.php?action=approve&u='.$unum.'&token='
					.md5($_POST['login'].'zerso'.md5($_POST['pass1']).'b0t'.$_POST['email']);

				mail(
					$_POST['email'],
					$txtp['reg_approve_subject'],
					$_POST['login'].$txtp['reg_approve_message'].$appr_link,
					"From:".$cfg['instance_name']." <".$safecfg['instance_email'].">"
				);
			}

			$message = 'registration_success';
		endif;

		if ($debug) echo $txt['ret_message_'.$message];

		setcookie('message', $message, 0, '/');

		if (!$debug) redirect_back();

	break;



	case 'approve':

		$user = $db->selectRow(
			'SELECT * FROM ?_users WHERE id = ?d AND approved <=> NULL', $_GET['u']
		);

		if ($user) {
			if ($_GET['token'] != md5($user['login'].'zerso'.$user['hash'].'b0t'.$user['email'])) $message = 'activation_wrong_token';
		} else $message = 'activation_no_user';

		if (!$message):

			$db->query('UPDATE ?_users SET approved = 1 WHERE id = ?', $user['id']);

			$avatar = Array(
				'user_id' => $user['id'],
				'param_key' => 'avatar',
				'param_value' => 'gravatar'
			);

			$db->query('INSERT INTO ?_user_settings (?#) VALUES (?a)', array_keys($avatar), array_values($avatar));

			setcookie('pass', $user['hash'], 0, '/');
			setcookie('login', $user['login'], 0, '/');
			setcookie('user', $user['id'], 0, '/');

			mail($user['email'], $txtp['reg_welcome_subject'], $user['login'].$txtp['reg_welcome_message'], "From:".$cfg['instance_name']." <".$safecfg['instance_email'].">");
			mail($safecfg['admin_email'], 'Новый пользователь Tinng', $user['login'].', '.$user['email'], "From:".$cfg['instance_name']." <".$safecfg['instance_email'].">");

			$message = 'activation_success';

		endif;

		//echo $message;

		setcookie('message', $message, 0, '/');

		redirect_back();

	break;

	case 'check_login':

		$user = $db->selectRow(
			'SELECT * FROM ?_users WHERE login = ?',
			$_POST['login']
		);

		if ($user) echo 'exists';
		else echo 'allowed';

	break;

	case 'check_email':

		$user = $db->selectRow(
			'SELECT * FROM ?_users WHERE email = ?',
			$_POST['email']
		);

		if ($user) echo 'exists';
		else echo 'allowed';
	break;

	default:
		echo 'action parameter not passed';

endswitch;
