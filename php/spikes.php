<?php
/* функции для пхп-движка, использующиеся повсеместно в скрипте */

function safe_str($str){
	return strip_tags($str,
		'<br><strong><b><em><i><span><div><ol><ul><li><sub><sup><hr><h2><h3><h4><blockquote>'
	);
}

function jsts2phpts ($str){
	return substr($str, 0, strlen($str)-3);
}

function jsts2sql($str){
	return date('Y-m-d H:i:s', jsts2phpts($str));
}

function incl_scripts(){
	$arr = func_get_args();
	foreach ($arr as $val):
		echo '<script type="text/javascript" language="JavaScript" src="'.$val.'"></script>'."\n";
	endforeach;
}

function incl_css(){
	$arr = func_get_args();
	foreach ($arr as $val):
		echo '<link rel="stylesheet" type="text/css" href="'.$val.'?N">'."\n";
	endforeach;
}

$rex['email'] = '/^[\_]*([a-z0-9]+(\.|\_*)?)+@([a-z][a-z0-9\-]+(\.|\-*\.))+[a-z]{2,6}$/';
$rex['login'] = '/^[a-zA-Z0-9_]{4,16}$/';
$rex['pass'] = '/^[a-zA-Z0-9_]{6,32}$/';
?>
