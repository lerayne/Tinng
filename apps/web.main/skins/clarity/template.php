<!DOCTYPE HTML>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

	<title><? template_title() ?></title>

	<? template_head() ?>

</head>

<body <? if (!$safecfg['production']) echo 'class="test"'?>>

<div id="tinng-main">

	<!-- Модальное окно -->
	<div id="dialogue-wrapper">
		<div id="curtain"></div>
		<div id="dialogue">
			<div id="dialogueInner">
				<header>
					<div class="title">
					</div>
					<a href="#" class="close">&times;</a>
				</header>
				<section></section>
			</div>
		</div>
	</div>

	<!-- Панель сообщений -->
	<div id="message-bar">
		<div class="message">
			<div class="text"></div>
		</div>
	</div>

	<!-- заголовок -->
	<header id="tinng-main-header">
		<div class="top-panel">
			<div class="left">
				<a class='signature' href='http://about.tinng.net'>
					Powered by
					<img src="<?= path('images/tinng_logo_small.png') ?>">
				</a>
			</div>
			<div class='right state-ind throbber'></div>
			<div class='right'>

				<? if (!$user || $user->id == 0): ?>

				<form id="tinng-top-login" action="<?= $env['appdir'] . 'login.php' ?>" method="post">
					<a class="button-link" id="loginBtn"><span><?= $txt['login_btn'] ?></span></a>
					<a class="button-link" id="regBtn"><span><?= $txt['login_reg'] ?></span></a>
				</form>

				<? else: ?>

				<form id="tinng-top-login" action="<?= $env['appdir'] . 'login.php' ?>" method="post">
					<input type="hidden" name="action" value="logout">
					<img src="<?= $user->portrait ?>" class="portrait">
					<strong><?= $user->display_name ? $user->display_name : $user->login ?></strong>
					<input type="hidden" name="lochash">
					<a class="button-link" id="logoutBtn"><span><?= $txt['login_logout'] ?></span></a>
				</form>

				<? endif; ?>

			</div>
			<div class='clearfix'></div>
		</div>

		<div id="decoration-area">
			<a class='logo' href='/'><img src="<?= path('images/logo.png') ?>"></a>
		</div>
	</header>

	<!-- область юнитов -->
	<div id="tinng-units-area">
		<!-- сюда пишутся юниты -->
	</div>

	<!-- футер -->
	<footer id="tinng-main-footer">

	</footer>

	<!-- масштабируемый бекграунд -->
	<img id="scaled-bg" src="<?= path('images/bg1.jpg') ?>">

</div>


<!-- шаблоны, обрабатываемые скриптом (скрыты) -->
<div id="tinng-chunks" class="none">

	<div data-chunk-name="unit" class="unit">
		<header></header>
		<div class="scroll-area">
			<div class="content-wrap">
				<div class="content"></div>
			</div>
		</div>
		<footer></footer>
	</div>

	<!-- Элемент столбца тем -->
	<div data-chunk-name="topic" class="node topic revealer">
		<div class="data_cell">
			<div data-cell="infobar" class="infobar">
				<div data-cell="created" class="created right reveal"></div>
				<div data-cell="parent" class="parent"></div>
				<div data-cell="author" class="author left"></div>
				<div data-cell="id" class="msgid left"></div>
				<div data-cell="postsquant" class="postsquant reveal"></div>
				<div class="clearboth"></div>
			</div>
			<div data-cell="topicname" class="topicname"></div>
			<div data-cell="message" class="message">
				<!-- основное сообщение -->
			</div>
			<div data-cell="lastmessage" class="lastmessage"></div>
			<div data-cell="tags" class="tags"></div>
			<div data-cell="controls" class="controls reveal"></div>
			<div class="clearboth"></div>
		</div>
	</div>

	<!-- Элемент столбца сообщений -->
	<div data-chunk-name="post" class="node post revealer">
		<div class="data_cell">
			<div data-cell="infobar" class="infobar">
				<div class="avatar"><img data-cell="avatar"></div>
				<div data-cell="created" class="created right reveal"></div>
				<div data-cell="parent" class="parent"></div>
				<div data-cell="author" class="author left"></div>
				<div data-cell="id" class="msgid left"></div>
				<div class="clearboth"></div>
			</div>
			<div data-cell="message" class="message">
				<!-- основное сообщение -->
			</div>
			<div class="tags"></div>
			<div data-cell="controls" class="controls reveal"></div>
			<div class="clearboth"></div>
		</div>
	</div>

	<!-- Редактор -->
	<div data-chunk-name="editor" class="editor">
		<div class="editor-inner">
			<input type="text" class="title"/>

			<div class="textarea-wrapper">
				<div contenteditable="true" class="textarea"></div>
			</div>

			<div class="submit button"><?= $txt['send'] ?></div>
			<span class="subtext"><?= $txt['press_to_send_post'] ?></span>
		</div>
	</div>

	<!-- Редактор (закрытый, для анонимуса) -->
	<div data-chunk-name="editor-disabled" class="editor">
		<div class="editor-inner">
			<?= $txt['login_to_write'] ?>
		</div>
	</div>


	<div data-chunk-name="login-form">

		<div class="w50 left">

			<h4><?= $txt['login_local'] ?></h4>

			<form action="<?= $env['appdir'] . 'login.php' ?>" method="post">
				<input type="hidden" name="action" value="login">
				<input type="hidden" name="lochash">

				<table cellpadding=5 cellspacing=5 border=0>
					<tr>
						<td><?= $txt['login_name'] ?></td>
						<td><input class="text" type="text" name="login"></td>
					</tr>
					<tr>
						<td><?= $txt['login_pass'] ?></td>
						<td>
							<input class="text" type="password" name="pass">
							<span class="dimmed" id="passForget">(<?= $txt['login_forget'] ?>)</span>
						</td>
					</tr>
					<tr>
						<td><?= $txt['login_memorize'] ?></td>
						<td><input type="checkbox" name="memorize"></td>
					</tr>
				</table>

				<input type="button" id="doLogin" value="<?= str('login_btn') ?>">

			</form>

		</div>

		<div class="w50 left">

			<h4><?= str('login_social') ?></h4>

			<a href="https://oauth.vk.com/authorize?client_id=<?= $safecfg['vk_app_id'] ?>&scope=&response_type=code&redirect_uri=<?= $e->full_app_path ?>vkauth.php">
				<img src="<?= path('images/vk.png')?>">
			</a>

		</div>

		<div class="clearfix"></div>

	</div>




	<div data-chunk-name="pass-restore-form">

		<div class="w50" style="margin:0 auto">

			<div style="margin:15px 0">
				<?= str('restore_text') ?>
			</div>

			<div style="text-align: center;">

				<?
				$quiz_num = mt_rand(0, count($quiz) - 1);
				$this_quiz = $quiz[$quiz_num];
				?>

				<input type="text" id="restoreInput" ><br><br>

				<b><?= $txt['reg_quiz_1'] ?>:</b><br>
				<?= $this_quiz['body'] ?><br>
				<input type="text" name="quiz" vldtr-enabled="true" vldtr-required="true"><br>

				<input type="hidden" name="number" value="<?= $quiz_num * 1 ?>">

				<input type="button" style="margin:10px 0" value="<?= str('restore_send') ?>">
			</div>

		</div>

	</div>


	<div data-chunk-name="registration-form">
		<form action="<?= $env['appdir'] ?>login.php" method="post" class="user-reg">
			<input type="hidden" name="action" value="register">

			<table cellpadding="5" cellspacing="5" border="0">

				<?
				$quiz_num = mt_rand(0, count($quiz) - 1);
				$this_quiz = $quiz[$quiz_num];
				?>

				<tr>
					<td><?= $txt['reg_login'] ?>:</td>
					<td>
						<input type="text" name="login" vldtr-enabled="true" vldtr-required="true" vldtr-filter="login"
							   vldtr-funcname="validateLogin">
					</td>
					<td><?= $txtp['reg_login_expalin'] ?></td>
				</tr>
				<tr>
					<td><?= $txt['reg_pass1'] ?>:</td>
					<td>
						<input id="regPass1" type="password" name="pass1" vldtr-enabled="true" vldtr-required="true"
							   vldtr-filter="pass" vldtr-eqref="#regPass2">
					</td>
					<td><?= $txtp['reg_pass_expalin'] ?></td>
				</tr>
				<tr>
					<td><?= $txt['reg_pass2'] ?>:</td>
					<td><input id="regPass2" type="password" name="pass2" vldtr-enabled="true" vldtr-required="true"
							   vldtr-eqref="#regPass1"></td>
					<td></td>
				</tr>
				<tr>
					<td><?= $txt['reg_email'] ?>:</td>
					<td><input type="text" name="email" vldtr-enabled="true" vldtr-required="true" vldtr-filter="email"
							   vldtr-funcname="validateEmail"></td>
					<td><?= $txtp['reg_email_expalin'] ?></td>
				</tr>
				<tr>
					<td><?= $txt['reg_quiz'] ?>:</td>
					<td colspan="2"><?= $this_quiz['body'] ?></td>
				</tr>
				<tr>
					<td><?= $txt['reg_answer'] ?>:</td>
					<td colspan="2"><input type="text" name="quiz" vldtr-enabled="true" vldtr-required="true"></td>
				</tr>
				<tr>
					<td colspan="3"><input type="submit" value="<?= $txt['reg_reg'] ?>"></td>
				</tr>

			</table>

			<input type="hidden" name="number" value="<?= $quiz_num * 1 ?>">

			<div>
				<h4><?= str('login_social') ?></h4>

				<a href="https://oauth.vk.com/authorize?client_id=<?= $safecfg['vk_app_id'] ?>&scope=&response_type=code&redirect_uri=<?= $e->full_app_path; ?>vkauth.php">
					<img src="<?= path('images/vk.png')?>">
				</a>

			</div>

		</form>
	</div>

	<div data-chunk-name="posts-default" class="posts-default">
		<?= $txtp['posts_default'] ?>
	</div>

</div>
</body>
</html>