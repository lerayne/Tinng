<?php
function safe_str($str){
	return strip_tags($str,
		'<br><strong><b><em><i><span><div><ol><ul><li><sub><sup><hr><h2><h3><h4>'
	);
}
?>
