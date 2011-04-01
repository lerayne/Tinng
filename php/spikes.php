<?php
/* функции для пхп-движка, использующиеся повсеместно в скрипте */

function safe_str($str){
	return strip_tags($str,
		'<br><strong><b><em><i><span><div><ol><ul><li><sub><sup><hr><h2><h3><h4><blockquote>'
	);
}

$rex['email'] = '/^[\_]*([a-z0-9]+(\.|\_*)?)+@([a-z][a-z0-9\-]+(\.|\-*\.))+[a-z]{2,6}$/';
$rex['login'] = '/^[a-zA-Z0-9_]{4,16}$/';
$rex['pass'] = '/^[a-zA-Z0-9_]{6,32}$/';
?>
