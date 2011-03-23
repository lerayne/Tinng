<script type="text/javascript" language="JavaScript">
<!--
mainOffset = <?= $main_offset ?>;
var txt = {};
var cfg = {};
<?php

foreach ($txt as $key => $val) echo "txt['".$key."'] = '".$val."';";
foreach ($cfg as $key => $val) echo "cfg['".$key."'] = ".
	(is_int($val) || is_float($val) ? $val.";" : "'".$val."';");

?>

// -->
</script>