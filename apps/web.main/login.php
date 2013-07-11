<?php

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
	//header ("Content-type:text/html;charset=utf-8;");
	header ("location: ". ($_SERVER["HTTP_REFERER"] ? $_SERVER["HTTP_REFERER"] : 'http://'.$_SERVER["HTTP_HOST"]).$_POST['lochash']);
	echo '|'.$_SERVER["HTTP_REFERER"].'|';
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
			setcookie('message', '1', 0, '/');
		}

		redirect_back();

	break;

	case 'logout':

		setcookie('pass', '', 0, '/');
		setcookie('login', '', 0, '/');
		setcookie('user', '', 0, '/');

		redirect_back();

	break;

	case 'register':

		setcookie('logdata', base64_encode(serialize($_POST)), 0, '/');

		if (!preg_match($rex['pass'], $_POST['pass1'])) $message = 10;
		if ($_POST['pass1'] != $_POST['pass2']) $message = 11;
		if (!preg_match($rex['email'], $_POST['email'])) $message = 12;
		if (!preg_match($rex['login'], $_POST['login'])) $message = 13;
		if ($_POST['quiz'] != trim($quiz[$_POST['number']*1]['answer'])) $message = 14;

		$raw = $db->selectRow(
			'SELECT * FROM ?_users WHERE login = ? OR email = ?'
			, $_POST['login']
			, $_POST['email']
		);
		if ($raw) $message = 15;

		if (!$message):

			$new_row = Array(
				'login' => $_POST['login'],
				'hash' => md5($_POST['pass1']),
				'email' => $_POST['email'],
				'reg_date' => date('Y-m-d H:i:s')
			);

			$unum = $db->query(
				'INSERT INTO ?_users (?#) VALUES (?a)', array_keys($new_row), array_values($new_row)
			);

//			$unum = 1; // тут был дебаг
			
			$appr_link = $location.'login.php?action=approve&u='.$unum.'&token='
				.md5($_POST['login'].'zerso'.md5($_POST['pass1']).'b0t'.$_POST['email']);

//			echo "<br><br>";
//			echo print_r($_REQUEST)."<br><br>";
//			echo $location."<br><br>";
//			echo  $_SERVER["HTTP_REFERER"]."<br><br>";
//			echo '|'.$_POST['email']."|<br><br>";
//			echo '|'.$txtp['reg_approve_subject']."|<br><br>";
//			echo $_POST['login'].$txtp['reg_approve_message'].$appr_link."<br><br>";

			mail(
				$_POST['email'],
				$txtp['reg_approve_subject'],
				$_POST['login'].$txtp['reg_approve_message'].$appr_link,
				"From:Tinng <noreply@tinng.net>\r\nReply-To:Tinng <noreply@tinng.net>\r\n"
			);

			$message = 20;
		endif;

		setcookie('message', $message, 0, '/');

		redirect_back();

	break;

	case 'approve':

		$user = $db->selectRow(
			'SELECT * FROM ?_users WHERE id = ?d AND approved <=> NULL', $_GET['u']
		);

		
		if ($_GET['token'] != md5($user['login'].'zerso'.$user['hash'].'b0t'.$user['email'])) $message = 17;
		if (!$user) $message = 16;

		if (!$message):

			$db->query('UPDATE ?_users SET approved = 1 WHERE id = ?', $user['id']);

			$db->query('INSERT INTO ?_user_settings (uset_user) VALUES (?d)', $user['id']);

			setcookie('pass', $user['hash'], 0, '/');
			setcookie('login', $user['login'], 0, '/');
			setcookie('user', $user['id'], 0, '/');

			mail($user['email'], $txtp['reg_welcome_subject'], $user['login'].$txtp['reg_welcome_message'], "From:Tinng <noreply@tinng.net>\r\nReply-To:Tinng <noreply@tinng.net>\r\n");
			mail('lerayne@gmail.com', 'Новый пользователь Tinng', $user['login'].', '.$user['email'], "From:Tinng <noreply@tinng.net>\r\nReply-To:Tinng <noreply@tinng.net>\r\n");

			$message = 21;

		endif;

		echo $message;

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
