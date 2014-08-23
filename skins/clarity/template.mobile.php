<!DOCTYPE HTML>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

	<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">

	<title><? template_title() ?></title>

	<? template_head() ?>

</head>

<body <? if (!$safecfg['production']) echo 'class="test"'?>>

<div id="tinng-units-area">



</div>


<!-- шаблоны, обрабатываемые скриптом (скрыты) -->
<div id="tinng-chunks" class="none">

	<div data-chunk-name="unit" class="unit">
		<header class="fixed-top">
			<div class="header-panel" data-cell="header"></div>
			<div class="settingsBtn" data-cell="settingsMenu">
				<span data-cell="settingsBtn"></span>
			</div>
		</header>
		<div class="scroll-area" data-cell="scrollArea">
			<div class="content-wrap" data-cell="contentWrap">
				<div class="content" data-cell="content"></div>
			</div>
		</div>
		<footer class="fixed-bottom" data-cell="footer"></footer>
	</div>

	<!-- Элемент столбца тем -->
	<div data-chunk-name="topic" class="node topic revealer">
		<div class="data_cell">
			<div data-cell="infobar" class="infobar">
				<div data-cell="menuBtn" class="menuBtn right reveal control">
					<span>&nbsp;</span>
					<div class="dropmenu" style="display:none" data-cell="controls"></div>
				</div>
				<div data-cell="created" class="created right reveal"></div>
				<div data-cell="parent" class="parent"></div>
				<div data-cell="author" class="author left"></div>
				<div data-cell="id" class="msgid left"></div>
				<div data-cell="postsquant" class="postsquant reveal"></div>
				<div class="clearboth"></div>
			</div>
			<div class="topicname">
				<span data-cell="topicname"></span>
				<span data-cell="private" class="private" style="display:none"><?= $txt['topic_private']?></span>
			</div>
			<div data-cell="message" class="message">
				<!-- основное сообщение -->
			</div>
			<div data-cell="lastmessage" class="lastmessage"></div>
			<div data-cell="tags" class="tags"></div>
			<div data-cell="controls2" class="controls2 reveal"></div>
			<div class="clearboth"></div>
		</div>
	</div>



	<!-- Элемент столбца сообщений -->
	<div data-chunk-name="post" class="node post revealer">
		<div class="data_cell">
			<div data-cell="infobar" class="infobar">
				<div data-cell="menuBtn" class="menuBtn right reveal control">
					<span>&nbsp;</span>
					<div class="dropmenu bodyclickhide" style="display:none" data-cell="controls"></div>
				</div>
				<div class="avatar" data-cell="avatar_box"><img data-cell="avatar"><div class="isOnline"></div></div>
				<div data-cell="created" class="created right reveal"></div>
				<div data-cell="parent" class="parent"></div>
				<div data-cell="author" class="author left"></div>
				<div data-cell="id" class="msgid left"></div>
				<div class="clearboth"></div>
			</div>
			<div data-cell="message" class="message">
				<!-- основное сообщение -->
			</div>
			<div data-cell="tags" class="tags"></div>
			<div data-cell="tags_edit" class="tags tags-edit"></div>
			<div data-cell="controls2" class="controls2"></div>
			<div class="clearboth"></div>
		</div>
	</div>

	<!-- Тэг -->
	<div data-chunk-name="tag" class="tag">
		<span data-cell="operation" style="display:none" class="operation"></span>
		<span data-cell="text" class="name"></span>
		<span data-cell="close" style="display:none" class="close">&times;</span>
	</div>

</div>

</body>
</html>