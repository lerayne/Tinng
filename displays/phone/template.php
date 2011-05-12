<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
	"http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title>UC alpha</title>
		
		<link id="favicon" rel="shortcut icon" type="image/png" href="skins/<?= $cfg['skin'] ?>/images/favicon.png">
		<meta content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" name="viewport" />
		<?
		// стили
		incl_css(
			  $device_path.'/interface.css'
			, 'skins/'.$cfg['skin'].'/phone_main.css'
		);
		?>
		
		<link rel="stylesheet" id="lowres_css" type="text/css" href="">
		
		<?
		// универсальные библиотеки
		incl_scripts(
			  'libraries/JsHttpRequest.js'
			, 'libraries/webtoolkit.js'
			, 'js/spikes.js'
			, 'js/object_spikes.js'
			, 'js/global_content.js'
		);
		
		// импорт переменных из PHP
		require_once 'php/js_vars_import.php';
		
		//	 скрипты самого сервиса
		incl_scripts(
			  $device_path.'/interface.js'
			, $device_path.'/content.js'
			, $device_path.'/focusing.js'
			, $device_path.'/onload.js'
		);
		?>

	</head>

	<body>
		
		<div id="app_area" class="invis">
		
			<div id="mode_tabs">
				<div id="tab_topics" class="left tab active"><?= $txt['header_topics'] ?></div>
				<div id="tab_posts" class="left tab"><?= $txt['header_posts'] ?></div>
			</div>
			
			<div class="viewport" id="viewport_topics">
				TOPICS
			</div>
			
			<div class="viewport none" id="viewport_posts">
				POSTS
			</div>
		
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
