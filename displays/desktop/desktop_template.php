<?php

$message = $_COOKIE['message'];

?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
	"http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title>UC alpha</title>
		
		<link id="favicon" rel="shortcut icon" type="image/png" href="skins/<?= $cfg['skin'] ?>/images/favicon.png">
		<!--[if lt IE 9]> <![endif]-->
	
		<?
		// стили
		incl_css(
			  $device_path.'interface.css'
			, 'skins/'.$cfg['skin'].'/desktop_main.css'
		);
		?>
		
		<link rel="stylesheet" id="lowres_css" type="text/css" href="">
		
		<?
		// универсальные библиотеки
		incl_scripts(
			  'libraries/JsHttpRequest.js'
			, 'lib_modified/nicEdit.js'
			, 'libraries/webtoolkit.js'
			, 'js/spikes.js'
			, 'js/object_spikes.js'
			, 'js/global_content.js'
		);
		
		// импорт переменных из PHP
		require_once 'php/js_vars_import.php';
		
		//	 скрипты самого сервиса
		incl_scripts(
			  $device_path.'interface.js'
			, $device_path.'content.js'
			//, $device_path.'focusing.js'
			, $device_path.'onload.js'
		);
		?>

	</head>

	<body>
		
		<!-- затемнение и блок поверх -->
		<div id="curtain"<?= $message ? '' : ' class="none"' ?>></div>
		<div id="over_curtain"<?= $message ? '' : ' class="none"' ?>>
			<div class="window">
				<div class="caption">
					<div class="title left">
						<?= $message ? $txt['title_message'] : '' ?>
					</div>
					<div class="close_btn right pointer"></div>
					<div class="clearboth"></div>
				</div>
				<div class="contents">
					<?= $message ? $txtp['ret_message_'.($message*1)] : '' ?>
				</div>
			</div>
		</div>

		<!-- верхняя панель -->
		<div id="top_bar">
			<div id="logo">UltiComm alpha 0.2</div>
			<div class="left"></div>
			<div class="right state_ind"></div>
			<div id="user_panel"><? require $device_path.'template_login.php'; ?></div>
			<div class="right">
				<div class="button" id="debug_toggle"><span>Консоль</span></div>
			</div>
			<div class="clearboth"></div>
		</div>
		
		<!-- основной блок -->
		<div id="app_area" class="invis">

			<table id="app_block" border="0" cellpadding="0" cellspacing="0">
				<tr id="app_block_tr">

					<? foreach ($columns as $key => $val): ?>

					<td class="global_column shadow resizeable" id="viewport_<?= $val ?>">
						<div class="column_inner">
							<div class="caption chrome">
								<div class="titlebar"><?= $txt['header_'.$val] ?></div>
								<div class="toolbar"></div>
							</div>
							<div>
								<div class="contents"></div>
							</div>
							<div class="chrome statusbar"></div>
						</div>
					</td>

					<? endforeach; ?>

				</tr>
			</table>

		</div>
		
		<!-- консоль -->
		<div id="debug_console" class="none">
			<table width="100%" cellpadding="0" cellspacing="0" border="0">
			<tr>
				<td width="50%" valign="top">
					<div id="console" class="debug"></div>
				</td><td valign="top">
					<div id="debug_stash">
						<div id="debug0" class="debug"></div>
						<div id="debug" class="debug"></div>
						<div id="debug2" class="debug"></div>
					</div>
				</td>
			</tr>
			</table>
		</div>
	</body>
</html>