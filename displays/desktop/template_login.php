<? if (!$user): ?>

<form id="loginForm" action="login.php?action=login" method="post">
	<?= $txt['login_name'] ?> <input type="text" name="login">
	<?= $txt['login_pass'] ?> <input type="password" name="pass">
	<?= $txt['login_memorize'] ?> <input type="checkbox" name="memorize">
	<input type="hidden" name="lochash">
	<input type="button" id="loginBtn" value="<?= $txt['login_btn'] ?>">
	<input type="button" id="regBtn" value="<?= $txt['login_reg'] ?>">
</form>

<? else: ?>

<form id="loginForm" action="login.php?action=logout" method="post">
	<?= $user->email ?>
	<input type="hidden" name="lochash">
	<input type="button" id="logoutBtn" value="<?= $txt['login_logout'] ?>">
</form>

<? endif; ?>