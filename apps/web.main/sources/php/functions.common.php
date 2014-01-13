<?php

//echo'<pre>';var_export($_SERVER);echo'</pre>';

/* функции для пхп-движка, использующиеся повсеместно в скрипте */
//todo - не принимает мейл с нижним подчеркиванием и минусом
$rex['email'] = '/^[\_]*([a-zA-Z0-9\_.-]+(\.|\_*)?)+@(([a-z][a-z0-9\-])|([a-z])+(\.|\-*\.))+[a-z]{1,6}$/';
//$rex['email'] = '/^[-a-z0-9!#$%&*+/=?^_`{|}~]+(?:\.[-a-z0-9!#$%&*+/=?^_`{|}~]+)*@(?:[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(?:aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$/';
$rex['login'] = "/^[a-zA-Z0-9._]{4,24}$/";
$rex['pass'] = "/^[a-zA-Z0-9._]{6,32}$/";
$rex['empty'] = "/^\s*$/";

function safe_str($str) {
	return strip_tags($str,
		'<br><strong><b><em><i><span><div><ol><ul><li><sub><sup><hr><h2><h3><h4><blockquote>'
	);
}

function jsts2phpts($str) {
	return substr($str, 0, strlen($str) - 3);
}

function jsts2sql($str) {
	return date('Y-m-d H:i:s', jsts2phpts($str));
}

function str($str) {
	global $txt, $txtp;
	if ($txtp[$str]) return $txtp[$str];
	elseif ($txt[$str]) return $txt[$str]; else return $str;
}

function incl_css() {
	$arr = func_get_args();

	global $env;

	// Собираем содержимое всех поданых css-файлов в переменную
	$script = '';
	foreach ($arr as $val):
		$script .= "\n" . file_get_contents($val);
	endforeach;

	// Объявляем имя файла
	$filename = $env['appdir'] . 'data/compiled/css_' . md5($script) . '.css';

	// Если такого файла нет - создаем
	if (!file_exists($filename)) {

		if (!file_exists($env['appdir'] . 'data/compiled')) mkdir($env['appdir'] . 'data/compiled');

		// для начала чистим директорию
		$compiled_path = $env['appdir'] . 'data/compiled/';
		if (file_exists($compiled_path)) {
			$dir = opendir($env['appdir'] . 'data/compiled/');
			while (($file = readdir($dir)) !== false) {
				// Только нужно проверить, что мы удаляем только ненужный файл (по префиксу)
				if (!(strpos($file, 'css_') === false)) unlink($env['appdir'] . 'data/compiled/' . $file);
			}
		}

		$less = new lessc();

		file_put_contents($filename, $less->parse($script));
	}

	echo '<link rel="stylesheet" type="text/css" href="' . $filename . '?N">' . "\n";
}

function incl_scripts() {
	$arr = func_get_args();

	global $safecfg, $env;

	if ($safecfg['production']) {

		// Собираем содержимое всех поданых js-файлов в переменную
		$script = '';
		foreach ($arr as $val):
			if (file_exists($val)) $script .= "\n" . file_get_contents($val);
		endforeach;

		// Объявляем имя файла
		$filename = $env['appdir'] . 'data/compiled/script_' . md5($script) . '.js';

		// Если такого файла нет - создаем
		if (!file_exists($filename)) {

			// для начала чистим директорию
			$dir = opendir($env['appdir'] . 'data/compiled/');
			while (($file = readdir($dir)) !== false) {
				// Только нужно проверить, что мы удаляем только ненужный файл (по префиксу)
				if (!(strpos($file, 'script_') === false)) unlink($env['appdir'] . 'data/compiled/' . $file);
			}

			if (function_exists('curl_init')) {
				$conn = curl_init("http://closure-compiler.appspot.com/compile");

				$param[] = 'js_code=' . urlencode($script);
				$param[] = 'compilation_level=SIMPLE_OPTIMIZATIONS';
				$param[] = 'output_format=json';
				$param[] = 'output_info=compiled_code';
				$param[] = 'output_info=errors';

				curl_setopt($conn, CURLOPT_POST, true);
				curl_setopt($conn, CURLOPT_POSTFIELDS, join('&', $param));
				curl_setopt($conn, CURLOPT_RETURNTRANSFER, true);

				$json = json_decode(curl_exec($conn), 'assoc');

				$error_path = $env['appdir'] . 'data/compiled/closure_errors.txt';
				$serverr_path = $env['appdir'] . 'data/compiled/closure_server_errors.txt';

				if (file_exists($error_path)) unlink($error_path);
				if (file_exists($serverr_path)) unlink($serverr_path);

				if ($json['errors']) file_put_contents($error_path, json_encode($json['errors'], JSON_PRETTY_PRINT));
				if ($json['serverErrors']) file_put_contents($serverr_path, json_encode($json['serverErrors'], JSON_PRETTY_PRINT));

				if (!$json['errors'] && !$json['serverErrors']) {
					$compiled_script = $json['compiledCode'];
				}
			}

			file_put_contents($filename, ($compiled_script) ? $compiled_script : $script);
		}

		echo '<script type="text/javascript" language="JavaScript" src="' . $filename . '"></script>';

	} else {

		foreach ($arr as $val):
			echo '<script type="text/javascript" language="JavaScript" src="' . $val . '"></script>' . "\n";
		endforeach;
	}
}

function now($format = false) {
	return ($format == 'sql') ? date('Y-m-d H:i:s') : time();
}

function curl($url, $param, $mode = 'plain') {

	if (function_exists('curl_init')) {

		$conn = curl_init($url);

		// Задаем POST вкачестве метода
		curl_setopt($conn, CURLOPT_POST, true);
		// Отправляем поля POST
		curl_setopt($conn, CURLOPT_POSTFIELDS, join('&', $param));
		// Получать результат в строку, а не выводить в браузер
		curl_setopt($conn, CURLOPT_RETURNTRANSFER, true);
		// не проверять SSL сертификат
		curl_setopt($conn, CURLOPT_SSL_VERIFYPEER, 0);
		// не проверять Host SSL сертификата
		curl_setopt($conn, CURLOPT_SSL_VERIFYHOST, 0);
		// это необходимо, чтобы cURL не высылал заголовок на ожидание
		curl_setopt($conn, CURLOPT_HTTPHEADER, array('Expect:'));

		$result = curl_exec($conn);

		switch ($mode) {
			case 'json':
				$result = json_decode($result, true);
				break;

			case 'json_object':
				$result = json_decode($result);
				break;
		}

		return $result;
	} else {
		return 'no cURL!';
	}
}
