<?php

header ('Content-type:text/html;charset=utf-8;');

require_once 'config.php';
require_once 'php/classes.php';
require_once 'php/spikes.php';
require_once 'locale/ru.php';
require_once 'libraries/DbSimple/Generic.php';



$db = DbSimple_Generic::connect($safecfg['db']);
$db->query('SET NAMES "utf8"');
$db->setIdentPrefix($safecfg['db_prefix'].'_');

$message = false;
$location = 'http://'.$_SERVER["HTTP_HOST"].'/';
//if (strpos($location, '?')) list($location, $trash) = split('?', $_SERVER["HTTP_REFERER"]);

switch ($_GET['action']):

	case 'login':

		$raw = $db->selectRow(
			'SELECT
				usr_id AS id,
				usr_login AS login,
				usr_email AS email
			FROM ?_users
			WHERE usr_hash = ? AND usr_approved = 1 AND (usr_login = ? OR usr_email = ?)'
			, md5($_POST['pass'])
			, $_POST['login']
			, $_POST['login']
		);

		if ($raw != false) {

			$time = ($_POST['memorize']) ? time()+(365*24*60*60) : false; // запоминаем на год
			setcookie('pass', md5($_POST['pass']), $time);
			setcookie('login', $raw['login'], $time);
			setcookie('user', $raw['id'], $time);

		} else {
			setcookie('message', '1');
		}

	break;

	case 'logout':

		setcookie('pass', '');
		setcookie('login', '');
		setcookie('user', '');

	break;

	case 'register':

		setcookie('logdata', base64_encode(serialize($_POST)));

		if (!preg_match($rex['pass'], $_POST['pass1'])) $message = 10;
		if ($_POST['pass1'] != $_POST['pass2']) $message = 11;
		if (!preg_match($rex['email'], $_POST['email'])) $message = 12;
		if (!preg_match($rex['login'], $_POST['login'])) $message = 13;
		if ($_POST['quiz'] != trim($quiz[$_POST['number']*1]['answer'])) $message = 14;

		$raw = $db->selectRow(
			'SELECT * FROM ?_users WHERE usr_login = ? OR usr_email = ?'
			, $_POST['login']
			, $_POST['email']
		);
		if ($raw) $message = 15;

		if (!$message):

			$new_row = Array(
				'usr_login' => $_POST['login'],
				'usr_hash' => md5($_POST['pass1']),
				'usr_email' => $_POST['email'],
				'usr_registered' => date('Y-m-d H:i:s')
			);

			$unum = $db->query(
				'INSERT INTO ?_users (?#) VALUES (?a)', array_keys($new_row), array_values($new_row)
			);
			
			$appr_link = $location.'login.php?action=approve&u='.$unum.'&token='
				.md5($_POST['login'].'zerso'.md5($_POST['pass1']).'b0t'.$_POST['email']);

			mail($_POST['email'], $txtp['reg_approve_subject'], $_POST['login'].$txtp['reg_approve_message'].$appr_link);

			$message = 20;
		endif;

		setcookie('message', $message);

	break;

	case 'approve':

		$user = $db->selectRow(
			'SELECT * FROM ?_users WHERE usr_id = ?d AND usr_approved <=> NULL', $_GET['u']
		);

		
		if ($_GET['token'] != md5($user['usr_login'].'zerso'.$user['usr_hash'].'b0t'.$user['usr_email'])) $message = 17;
		if (!$user) $message = 16;

		if (!$message):

			$db->query('UPDATE ?_users SET usr_approved = 1 WHERE usr_id = ?', $user['usr_id']);

			$db->query('INSERT INTO ?_user_settings (uset_user) VALUES (?d)', $user['usr_id']);

			setcookie('pass', $user['usr_hash']);
			setcookie('login', $user['usr_login']);
			setcookie('user', $user['usr_id']);

			mail($user['usr_email'], $txtp['reg_welcome_subject'], $user['usr_login'].$txtp['reg_welcome_message']);

			$message = 21;

		endif;

		setcookie('message', $message);

	break;

endswitch;
/*
echo '<pre>';
var_dump($_SERVER);
echo '</pre>';
*/
header("location: ".$location.$_POST['lochash']);
?>
