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
		
		
		// импорт переменных из PHP
		require_once 'php/js_vars_import.php';
		
		incl_scripts(
			 'libraries/JsHttpRequest.js'
			, 'lib_modified/nicEdit.js'
			, 'libraries/jquery-1.7.min.js'
			, 'libraries/webtoolkit.js'
			, 'js/spikes.js'
			, 'js/object_spikes.js'
			, 'js/global_content.js'
			, $device_path.'interface_googleskin.js'
			, $device_path.'content.js'
			//, $device_path.'focusing.js'
			, $device_path.'onload.js'
		);
		?>

	</head>

	<body>
		<div id="top_bar" class="none">
			<div class="state_ind"></div>
		</div>
		
		<div id="viewport_topics" style="position: fixed; top:0; left:0; width: 40%; overflow:scroll">
			<div class="titlebar"></div>
			
			<div class="contents">
			</div>
			
			<div class="statusbar none"></div>
		</div>
		
		<div style="width: 40%; height: 300px; float:left;"></div>
		
		<div id="viewport_posts" style="width:60%; float: right;">
			<div class="titlebar"></div>
			
			<div class="contents">
			</div>
			
			<div class="typing_panel">
			</div>
			
			<div class="statusbar none"></div>
		</div>
		
	</body>
</html>