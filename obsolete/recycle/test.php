<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<script src="/libraries/jquery-1.7.2.min.js"></script>

		
		<style>
			#templates {display: none;}
		</style>
	</head>
	<body>

	<? if (function_exists('json_decode')) echo "JSON!" ?>

	<form action="http://closure-compiler.appspot.com/compile" method="POST">
		<p>Type JavaScript code to optimize here:</p>
		<textarea name="js_code" cols="50" rows="5">
			function hello(name) {
			// Greets the user
			alert('Hello, ' + name);
			}
			hello('New user');
		</textarea>
		<input type="hidden" name="compilation_level" value="WHITESPACE_ONLY">
		<input type="hidden" name="output_format" value="text">
		<input type="hidden" name="output_info" value="errors">
		<br><br>
		<input type="submit" value="Optimize">
	</form>
		
	</body>
</html>
