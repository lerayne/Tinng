<?php

$message = $_COOKIE['message'];

?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
	"http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title>UC alpha</title>

		<script type="text/javascript" language="JavaScript" src="libraries/JsHttpRequest.js"></script>
		<script type="text/javascript" language="JavaScript" src="lib_modified/nicEdit.js"></script>
		<script type="text/javascript" language="JavaScript" src="libraries/webtoolkit.js"></script>
		<script type="text/javascript" language="JavaScript" src="js/spikes.js"></script>
		<script type="text/javascript" language="JavaScript" src="js/object_spikes.js"></script>

		<link rel="stylesheet" type="text/css" href="<?= $device_path ?>/interface.css?N">
		<link rel="stylesheet" type="text/css" href="<?= $device_path ?>/content.css?N">
		<link id="favicon" rel="shortcut icon" type="image/png" href="images/favicon.png">
		<!--[if lt IE 9]> <![endif]-->

		<style type="text/css">

		#main {
			padding:<?= $main_offset ?>px;
		}

		</style>

		<? require_once 'php/js_vars_import.php'?>

		<script type="text/javascript" language="JavaScript" src="<?= $device_path ?>/interface.js"></script>
		<script type="text/javascript" language="JavaScript" src="<?= $device_path ?>/content.js"></script>
		<script type="text/javascript" language="JavaScript" src="<?= $device_path ?>/focusing.js"></script>
		<script type="text/javascript" language="JavaScript">
		<!--

		window.onload = function(){
			startInterface();
			startEngine();
			removeCurtain();
		}

		// -->
		</script>

	</head>
	<!-- onFocus="activate()" onBlur="deactivate()" -->
	<body>
		
		<div id="curtain"<?= $message ? '' : ' class="none"' ?>></div>
		<div id="overdiv"<?= $message ? '' : ' class="none"' ?>>
			<div class="window">
				<div>
					<div class="title left">
						<?= $message ? $txt['title_message'] : '' ?>
					</div>
					<div class="close right"></div>
					<div class="clearboth"></div>
				</div>
				<div class="overcontent">
					<?= $message ? $txtp['ret_message_'.($message*1)] : '' ?>
				</div>
			</div>
		</div>

		<div id="main_menu">
			<div id="logo">UltiComm alpha 0.2</div>
			<div id="left_pan">
				
			</div>
			<div id="user_panel"><? require $device_path.'/template_login.php'; ?></div>
			<div id="right_pan">
				<div class="button" id="debug_toggle"><span>Панель отладки</span></div>
			</div>
			<div class="clearboth"></div>
		</div>

		<div id="main" class="invis">

			<table id="app_frame_table" border="0" cellpadding="0" cellspacing="0">
				<tr id="app_frame_tr">

					<?php foreach ($columns as $key => $val): ?>

					<td class="global_column shadow resizeable" id="viewport_<?= $val ?>">
						<div class="column_inner">
							<div class="chrome top_bars">
								<div class="titlebar"><?= $txt['header_'.$val] ?></div>
								<div class="toolbar"></div>
							</div>
							<div>
								<div class="contents"></div>
							</div>
							<div class="chrome statusbar"></div>
						</div>
					</td>

					<?php endforeach; ?>

				</tr>
			</table>

		</div>
		
		<div id="debug_depo" class="none">
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