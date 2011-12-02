<script type="text/javascript" language="JavaScript">
<!--
// Убогая заглушка авторизации на клиенте
userID = <?= $user ? $user->id : 'null'?>;
var txt = {};
var cfg = {};
<?php

foreach ($txt as $key => $val) echo "txt['".$key."'] = '".$val."';\n";
echo "\n";
foreach ($cfg as $key => $val) echo "cfg['".$key."'] = ".
	(is_int($val) || is_float($val) ? $val.";\n" : "'".$val."';\n");

?>

// -->
</script>