<!DOCTYPE html>
<html>
<head>
	<!-- global style -->
	<link rel="stylesheet" href="./polymer/style/global.css" shim-shadowdom>

	<!-- libraries -->
	<script src = "./bower_components/jquery/dist/jquery.min.js"></script>
	<script src = "./bower_components/lodash/dist/lodash.min.js"></script>
	<!--<script src = "./bower_components/es6-shim/es6-shim.min.js"></script>-->

	<!-- todo - нужен в IE11, FF24, Safari 7, Opera 12, iOS7-->
	<script src = "./bower_components/es6-promise-polyfill/promise.min.js"></script>

	<!-- todo - platform is not needed in chrome 36+ -->
	<script src="./bower_components/platform/platform.js"></script>

	<title>TINNG Polymer Test</title>

	<!-- tinng universal modules -->
	<script src="./polymer/js/namespace.js"></script>

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

	<script src="./sources/js/classes/common/Funcs.js"></script>
	<script src="./sources/js/classes/common/connection/Connection.js"></script>
	<script src="./sources/js/classes/common/connection/engines/XHRShortPoll.js"></script>
	<script src="./polymer/js/init.js"></script>

	<!-- polymer itself -->
	<link rel="import" href="./bower_components/polymer/polymer.html">

	<!-- stock polymer components -->
	<link rel="import" href="./bower_components/core-signals/core-signals.html">

	<!-- custom polymer components -->
	<link rel="import" href="./polymer/components/widget-frame/widget-frame.html">
	<link rel="import" href="./polymer/components/nodelist-topics/nodelist-topics.html">
	<link rel="import" href="./polymer/components/nodelist-posts/nodelist-posts.html">
	<link rel="import" href="./polymer/components/control-editor/control-editor.html">


</head>

<body fullbleed horizontal layout unresolved>

<widget-frame>
	<control-panel></control-panel>
	<nodelist-topics class="content"></nodelist-topics>
</widget-frame>

<widget-frame>
	<control-panel></control-panel>
	<nodelist-posts class="content"></nodelist-posts>
	<control-editor class="footer"></control-editor>
</widget-frame>

</body>
</html>
