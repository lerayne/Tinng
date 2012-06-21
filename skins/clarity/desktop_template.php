<!DOCTYPE HTML>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title><? template_title() ?></title>
		
		<? template_head() ?>

	</head>
	
	<body <? if (!$safecfg['production']) echo 'class="test"'?>>

		<div id="tinng-main">

			<div id="dialogue-wrapper">
				<div id="curtain"></div>
				<div id="dialogue"></div>
			</div>
			
			<header id="tinng-main-header">
				<a class='logo' href='/'><img src="<?= path('/images/stock/logo_tiny.png') ?>"></a>
				<div class='right state-ind'></div>
				<div class='right'>
					<? require $device_path.'template_login.php'; ?>
				</div>
				<div class='clearfix'></div>
			</header>

			<div id="tinng-units-area">
			<!-- сюда пишутся юниты -->
			</div>
			
			<footer id="tinng-main-footer">
				
			</footer>
		
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


			<div data-chunk-name="topic" class="node topic revealer">
				<div class="data_cell">
					<div class="infobar">
						<div data-cell="created" class="created right reveal"></div>
						<div data-cell="parent" class="parent"></div>
						<div data-cell="author" class="author left"></div>
						<div data-cell="id" class="msgid left"></div>
						<div data-cell="postsquant" class="postsquant reveal"></div>
						<div class="clearboth"></div>
					</div>
					<div class="topicname editabletopic revealer2">
						<div data-cell="topicname" class="left"></div>
						<div class="sbtn btn_topicedit right reveal2"></div>
						<div class="sbtn btn_topiccancel right none"></div>
						<div class="sbtn btn_topicsubmit right none"></div>
						<div class="clearboth"></div>
					</div>
					<div data-cell="message" class="message">
						<!-- основное сообщение -->
					</div>
					<div data-cell="lastmessage" class="lastmessage"></div>
					<div data-cell="tags" class="tags"></div>
					<div data-cell="controls" class="controls reveal"></div>
					<div class="clearboth"></div>
				</div>
			</div>


			<div data-chunk-name="post" class="node post revealer">
				<div class="data_cell">
					<div class="infobar">
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
					<div class="controls reveal">
						<div class="sbtn editmessage"></div>
						<div class="sbtn deletemessage"></div>
						<div class="explain subtext"></div>
						<div class="clearboth"></div>
					</div>
					<div class="clearboth"></div>
				</div>
			</div>

			<div data-chunk-name="editor" class="editor">
				<div class="editor-inner">
					<input type="text" class="title" />
					<div contenteditable="true" class="textarea"></div>

					<div class="submit button"><?= $txt['send'] ?></div>
				</div>
			</div>

		</div>
	</body>
</html>