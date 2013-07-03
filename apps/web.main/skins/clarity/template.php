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
<!--			<a class='logo' href='/'><img src="--><?//= path('images/logo_tiny.png') ?><!--"></a>-->
				<div class="top-panel">
					<div class='right state-ind throbber'></div>
					<div class='right'>
						<? require path('template.login.php'); ?>
					</div>
					<div class='clearfix'></div>
				</div>
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
					<input type="text" class="title" />
					<div class="textarea-wrapper">
						<div contenteditable="true" class="textarea"></div>
					</div>

					<div class="submit button"><?= $txt['send'] ?></div>
				</div>
			</div>

            <!-- Редактор (закрытый, для анонимуса) -->
            <div data-chunk-name="editor-disabled" class="editor">
                <div class="editor-inner">
                    <?= $txt['login_to_write'] ?>
                </div>
            </div>

		</div>
	</body>
</html>