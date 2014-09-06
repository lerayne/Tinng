<!DOCTYPE html>
<html>
<head>
	<!-- global style -->
	<link rel="stylesheet" href="./style/global.css" shim-shadowdom>

	<!-- libraries -->
	<script src = "../lib/jquery-2.x.js"></script>
	<script src = "../../sandbox/bower_components/lodash/dist/lodash.min.js"></script>

	<!-- todo - platform is not needed in chrome 36+ -->
	<script src="../../sandbox/bower_components/platform/platform.js"></script>

	<title>TINNG Polymer Test</title>

	<!-- tinng universal modules -->
	<script src="./js/namespace.js"></script>

	<script>
		tinng.txt = {};
		tinng.cfg = {};
		tinng.rex = {};
		<?
			foreach ($txt as $key => $val) echo "tinng.txt['" . $key . "'] = '" . import_php_str($val) . "';\n";
			echo "\n";

			foreach ($cfg as $key => $val) echo "tinng.cfg['" . $key . "'] = " . (is_int($val) || is_float($val) ? $val . ";\n" : "'" . $val . "';\n");
			echo "\n";

			foreach ($rex as $key => $val) echo "tinng.rex['" . $key . "'] = " . $val . ";\n";
			echo "\n";
		?>
	</script>

	<script src="../sources/js/classes/common/Funcs.js"></script>
	<script src="../sources/js/classes/common/connection/Connection.js"></script>
	<script src="../sources/js/classes/common/connection/engines/XHRShortPoll.js"></script>
	<script src="./js/init.js"></script>

	<!-- polymer itself -->
	<link rel="import" href="../../sandbox/bower_components/polymer/polymer.html">

	<!-- stock polymer components -->
	<link rel="import" href="../../sandbox/bower_components/core-signals/core-signals.html">

	<!-- custom polymer components -->
	<link rel="import" href="./components/service-forwarder/service-forwarder.html">
	<link rel="import" href="./components/widget-frame/widget-frame.html">
	<link rel="import" href="components/nodelist-topics/nodelist-topics.html">
	<link rel="import" href="components/nodelist-posts/nodelist-posts.html">


</head>

<body fullbleed horizontal layout unresolved>

<widget-frame>
	<control-panel></control-panel>
	<nodelist-topics></nodelist-topics>
</widget-frame>

<widget-frame>
	<control-panel></control-panel>
	<nodelist-posts></nodelist-posts>
</widget-frame>

</body>
</html>
