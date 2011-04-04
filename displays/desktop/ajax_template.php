<?php
require_once '../../locale/ru.php';
require_once '../../libraries/JsHttpRequest.php';
$req =& new JsHttpRequest("utf-8");

$template = $_REQUEST['template'];

switch ($template):
case 'regform':

	$quiz_num = mt_rand(0, count($quiz)-1);
	$this_quiz = $quiz[$quiz_num];

	$post = unserialize(base64_decode($_COOKIE['logdata']));

	?>

	<form action="login.php?action=register" method="post">
	<table cellpadding="5" cellspacing="5" border="0">

		<tr>
			<td><?= $txt['reg_login'] ?>:</td>
			<td> <input type="text" name="login" value="<?= $post['login'] ?>"></td>
			<td class="subtext"><?= $txtp['reg_login_expalin'] ?></td>
		</tr><tr>
			<td><?= $txt['reg_pass1'] ?>:</td>
			<td> <input type="password" name="pass1"></td>
			<td class="subtext"><?= $txtp['reg_pass_expalin'] ?></td>
		</tr><tr>
			<td><?= $txt['reg_pass2'] ?>:</td>
			<td> <input type="password" name="pass2"></td>
			<td class="subtext"></td>
		</tr><tr>
			<td><?= $txt['reg_email'] ?>:</td>
			<td> <input type="text" name="email" value="<?= $post['email'] ?>"></td>
			<td class="subtext"><?= $txtp['reg_email_expalin'] ?></td>
		</tr><tr>
			<td><?= $txt['reg_quiz'] ?>:</td>
			<td colspan="2"><?= $this_quiz['body'] ?></td>
		</tr><tr>
			<td><?= $txt['reg_answer'] ?>:</td>
			<td colspan="2"><input type="text" name="quiz"></td>
		</tr><tr>
			<td colspan="3"><input type="submit" value="<?= $txt['reg_reg'] ?>"></td>
		</tr>

	</table>

		<input type="hidden" name="number" value="<?= $quiz_num*1 ?>">

	</form>

	<?

break;


endswitch;

$GLOBALS['_RESULT'] = true;
?>
