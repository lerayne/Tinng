<? if (!$user || $user->id == 0): ?>

	<form id="tinng-top-login" action="<?= $env['appdir'].'login.php' ?>" method="post">
		<input type="hidden" name="action" value="login">
		<?= $txt['login_name'] ?> <input class="text" type="text" name="login">
		<?= $txt['login_pass'] ?> <input class="text" type="password" name="pass">
		<span class="dimmed" id="passForget">(<?= $txt['login_forget'] ?>)</span>
		<?= $txt['login_memorize'] ?> <input type="checkbox" name="memorize">
		<input type="hidden" name="lochash">
		<input type="button" id="loginBtn" value="<?= $txt['login_btn'] ?>">
		<a id="regBtn"><?= $txt['login_reg'] ?></a>
	</form>

<? else: ?>

	<form id="tinng-top-login" action="<?= $env['appdir'].'login.php' ?>" method="post">
		<input type="hidden" name="action" value="logout">
		<?= $user->login ?>
		<input type="hidden" name="lochash">
		<input type="button" id="logoutBtn" value="<?= $txt['login_logout'] ?>">
	</form>

<? endif; ?>