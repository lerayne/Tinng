<?php

$message = $_COOKIE['message'];

function template_title(){
	echo 'Tinng alpha';
}

function template_head(){
	
	global $device_path, $display_mode, $cfg, $user;
	
	echo '
		<link id="favicon" rel="shortcut icon" type="image/png" href="skins/'.$cfg['skin'].'/images/favicon.png">
		<!--[if lt IE 9]> <![endif]-->
	';
	
	// Импорт стилей через функцию
	incl_css(		
		$device_path.'main.css',
		'skins/'.$cfg['skin'].'/styles/desktop_design.css'
	);

	echo '<link rel="stylesheet" id="lowres_css" type="text/css" href="">';
	//echo '<script type="text/javascript" language="JavaScript" src="libraries/jquery-1.7.2.min.js"></script>';

	import_js_vars();
	
	incl_scripts(
		'libraries/JsHttpRequest.js',
		'lib_modified/nicEdit.js',
		'libraries/webtoolkit.js',
		'js/spikes.js',
		'js/object_spikes.js',
		'js/global_content.js',
		'skins/'.$cfg['skin'].'/scripts/'.$display_mode.'_interface.js',
		$device_path.'content.js',
		//$device_path.'focusing.js',
		$device_path.'onload.js'
	);
}

require 'skins/'.$cfg['skin'].'/'.$display_mode.'_template.php';
?>