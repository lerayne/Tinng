<?php
$cfg['skin'] = 'aquamarine';

$message = $_COOKIE['message'];

function template_title(){
	echo 'Tinng alpha';
}

function path($file){
	global $cfg;
	return (file_exists('/skins/'.$cfg['skin'].$file)) ? '/skins/'.$cfg['skin'].$file : $file;
}

function template_head(){
	
	global $device_path, $display_mode, $cfg, $user, $appdir;
	
	echo '
		<link id="favicon" rel="shortcut icon" type="image/png" href="'. path('/images/favicon.png') .'">
		<!--[if lt IE 9]> <![endif]-->
	';
	
	// Импорт стилей через функцию
	incl_css(		
		$device_path.'main.css',
		$appdir.'skins/'.$cfg['skin'].'/styles/desktop_design.css'
	);

	echo '<link rel="stylesheet" id="lowres_css" type="text/css" href="">';
	echo '<script type="text/javascript" language="JavaScript" src="libraries/jquery-1.7.2.min.js"></script>';

	import_js_vars();
	
	incl_scripts(
		'libraries/JsHttpRequest.js',
		'obsolete/lib_modified/nicEdit.js',
		'libraries/webtoolkit.js',
		'obsolete/js/spikes.js',
//		'js/funcs.js',
		'obsolete/js/object_spikes.js',
		'obsolete/js/global_content.js',
		'obsolete/skins/'.$cfg['skin'].'/scripts/'.$display_mode.'_interface.js',
		$device_path.'content.js',
		//$device_path.'focusing.js',
		$device_path.'onload.js'
	);
}

require $rootdir.'skins/'.$cfg['skin'].'/'.$display_mode.'_template.php';