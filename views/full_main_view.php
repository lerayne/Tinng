<?php
/* Шаблон для полноценного ajax-ориентированного приложения для современных браузеров */
?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
	"http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title>UC alpha</title>
		<script type="text/javascript" language="JavaScript" src="libraries/JsHttpRequest.js"></script>
		<script type="text/javascript" language="JavaScript" src="lib_modified/nicEdit.js"></script>
		<script type="text/javascript" language="JavaScript" src="spikes.js"></script>
		<script type="text/javascript" language="JavaScript" src="object_spikes.js"></script>
		<link rel="stylesheet" type="text/css" href="interface/main_interface.css?N">
		<link rel="stylesheet" type="text/css" href="interface/main_content.css?N">
		<link rel="shortcut icon" type="image/png" href="images/favicon.png">
		<!--[if lt IE 9]>
		<link rel="stylesheet" type="text/css" href="interface/main_interface_ie.css?N">
		<![endif]-->
		<style type="text/css">

		#main {
			padding:<?= $main_offset ?>px;
		}

		</style>

		<? require_once 'php/js_vars_import.php'?>

		<script type="text/javascript" language="JavaScript" src="interface/main_interface.js"></script>
		<script type="text/javascript" language="JavaScript" src="engine.js"></script>
		<script type="text/javascript" language="JavaScript" src="js/focusing.js"></script>

		<script type="text/javascript" language="JavaScript">
		<!--

		function jawiInit(){
			startInterface();
			startEngine();
			removeCurtain();
		}

		// -->
		</script>

	</head>
	<!-- onFocus="activate()" onBlur="deactivate()" -->
	<body onLoad="jawiInit()">
		
		<div id="overlay" class=" none"></div>
		<div id="load_curtain"></div>

		<div id="main_menu">
			<div id="logo">UltiComm alpha 0.1</div>
			<div id="left_pan">
				
			</div>
			<div id="user_panel"><?= $user->email ?></div>
			<div id="right_pan">
				<div class="button" id="debug_toggle"><span>Панель отладки</span></div>
			</div>
			
		</div>

		<div id="main" class="invis">

			<table id="app_frame_table" border="0" cellpadding="0" cellspacing="0">
				<tr id="app_frame_tr">

					<?php foreach ($columns as $key => $val): ?>

					<td class="global_column shadow resizeable"  type="<?= $val?>" id="col_<?= $key ?>">
						<div class="column_inner">
							<div class="chrome top_bars">
								<div class="col_titlebar"><?= $txt['header_'.$val] ?></div>
								<div class="col_menubar"></div>
							</div>
							<div class="col_content">
								<div class="content" id="content_<?= $key ?>"></div>
							</div>
							<div class="chrome col_statusbar"></div>
						</div>
					</td>

					<?php endforeach; ?>

				</tr>
			</table>

		</div>
		<div id="debug_depo" class="none">
			<div id="console" class="debug"></div>
			<div id="debug0" class="debug"></div>
			<div id="debug" class="debug"></div>
			<div id="debug2" class="debug"></div>
		</div>
	</body>
</html>