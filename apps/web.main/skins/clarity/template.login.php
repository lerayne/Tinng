<? if (!$user || $user->id == 0): ?>

	<form id="tinng-top-login" action="login.php?action=login" method="post">
		<?= $txt['login_name'] ?> <input class="text" type="text" name="login">
		<?= $txt['login_pass'] ?> <input class="text" type="password" name="pass">
		<?= $txt['login_memorize'] ?> <input type="checkbox" name="memorize">
		<input type="hidden" name="lochash">
		<input type="button" id="loginBtn" value="<?= $txt['login_btn'] ?>">
		<input type="button" id="regBtn" value="<?= $txt['login_reg'] ?>">
	</form>

<? else: ?>

	<form id="tinng-top-login" action="login.php?action=logout" method="post">
		<?= $user->email ?>
		<input type="hidden" name="lochash">
		<input type="button" id="logoutBtn" value="<?= $txt['login_logout'] ?>">
	</form>

<? endif; ?>