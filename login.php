<?php
require_once 'config.php';
require_once 'php/classes.php';
require_once 'libraries/DbSimple/Generic.php';

$db = DbSimple_Generic::connect($safecfg['db']);
$db->query('SET NAMES "utf8"');
$db->setIdentPrefix($safecfg['db_prefix'].'_');

switch ($_GET['action']):

	case 'login':

		$raw = $db->selectRow(
			'SELECT
				usr_id AS id,
				usr_login AS login,
				usr_email AS email
			FROM ?_users
			WHERE usr_hash = ? AND (usr_login = ? OR usr_email = ?)'
			, md5($_POST['pass'])
			, $_POST['login']
			, $_POST['login']
		);

		if ($raw != false) {
			$time = ($_POST['memorize']) ? time()+(365*24*60*60) : false; // запоминаем на год
			setcookie('pass', md5($_POST['pass']), $time);
			setcookie('login', $raw['login'], $time);

		} else {
			$error = 1;
		}

	break;

	case 'logout':

		setcookie('pass', '');
		setcookie('login', '');

	break;

endswitch;

header("location: ".$_SERVER["HTTP_REFERER"].( $error ? "?ret=".$error : '' ));
?>
