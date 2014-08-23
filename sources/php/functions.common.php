<?php

//echo'<pre>';var_export($_SERVER);echo'</pre>';

/* функции для пхп-движка, использующиеся повсеместно в скрипте */
//todo - не принимает мейл с нижним подчеркиванием и минусом
$rex['email'] = '/^[\_]*([a-zA-Z0-9\_.-]+(\.|\_*)?)+@(([a-z][a-z0-9\-])|([a-z])+(\.|\-*\.))+[a-z]{1,6}$/';
//$rex['email'] = '/^[-a-z0-9!#$%&*+/=?^_`{|}~]+(?:\.[-a-z0-9!#$%&*+/=?^_`{|}~]+)*@(?:[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(?:aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$/';
$rex['login'] = '/^[a-zA-Z0-9._]{4,24}$/';
$rex['pass'] = '/^[a-zA-Z0-9._]{6,32}$/';
$rex['empty'] = '/^\s*$/';
$rex['imageURL'] = '/(\s|>|^|;)((ht|f)tp[s]{0,1}:\/\/[a-z0-9\._\-\/]{7,}?\.(jp[e]{0,1}g|png|gif))(\s|<|$|&)/gim';

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
	$filename = $env['appdir'] . 'data/compiled/css_'. $env['platform'] .'_' . md5($script) . '.css';

	// Если такого файла нет - создаем
	if (!file_exists($filename)) {

		if (!file_exists($env['appdir'] . 'data/compiled')) mkdir($env['appdir'] . 'data/compiled');

		// для начала чистим директорию
		$compiled_path = $env['appdir'] . 'data/compiled/';
		if (file_exists($compiled_path)) {
			$dir = opendir($env['appdir'] . 'data/compiled/');
			while (($file = readdir($dir)) !== false) {
				// Только нужно проверить, что мы удаляем только ненужный файл (по префиксу)
				if (!(strpos($file, 'css_'.$env['platform']) === false)) unlink($env['appdir'] . 'data/compiled/' . $file);
			}
		}

		$less = new lessc();

		file_put_contents($filename, $less->parse($script));
	}

	echo '<link rel="stylesheet" type="text/css" href="' . $filename . '?N">' . "\n";
}


function add_slash($str){
	return $str[strlen($str)-1] == '/' ? $str : $str.'/';
}

function get_script ($source_path, $path, $debug = false) {

	// извлекаем файловую и папочную часть из пути, поданного в инклюд-записи
	$chunks = explode('/', $path);
	$filename = $chunks[count($chunks)-1];
	unset ($chunks[count($chunks)-1]);
	$sec_path = join('/', $chunks);

	// запоминаем где мы находимся в файловом дереве
	$source_path = add_slash($source_path).$sec_path;

	// в инклюде может быть и абсолютный путь
	if (!file_exists($path)) {
		$path = add_slash($source_path).$filename;
	}

	// инициализация
	$contents = Array();
	$includes = Array();

	// если такой файл есть - читаем его и его зависимости
	if (file_exists($path)) {

		$file = fopen($path, 'r');

		while (($buffer = fgets($file)) !== false){

			if (!$debug) $contents[] = $buffer;

			// читаем конфиг до первой строки, состоящей целиком из пробельных символов
			if (preg_match('/^\s*$/', $buffer)) $config_ended = true;

			if ($debug && $config_ended) break;

			if (!$config_ended && strpos($buffer, '@include')){
				$chunks = explode('@include', $buffer);
				$child_path = trim($chunks[1]);
				$includes[] = $child_path;
			}
		}

		fclose($file);

	} elseif ($filename == '*' && file_exists($source_path)) {
		// иначе если указана папка - генерируем зависимости из списка папок

		$dir = opendir($source_path);

		while (($file = readdir($dir)) !== false) {

			if (preg_match('/^.*\.js$/', $file)) $includes[] = $file;
			if (is_dir($source_path.'/'.$file) && $file != '.' && $file != '..') $includes[] = $file.'/*';
		}
	}

	// если есть какие-то зависимости - рекурсивно вызываем все указанные
	if (count($includes)){

		$includes = array_reverse($includes);

		$children = Array();

		foreach ($includes as $child_path) {
			if (file_exists($source_path.'/'.$child_path) || file_exists($child_path) || (file_exists($source_path) && $child_path[strlen($child_path)-1] == '*')) {
				$children[] = get_script($source_path, $child_path, $debug);
			}
		}
	}

	$return = Array('path' => $path);

	if (count($contents)) $return['contents'] = join('', $contents);
	if (count($children)) $return['children'] = $children;

	return $return;
}

function get_js($maps, $debug = false) {
	global $cfg, $env;

	// выстраивание скриптов и их адресов в нужном порядке (массив выходит перевернутый!)
	function parse_map ($array, &$script_paths, &$script_contents) {

		if ($array['path'][strlen($array['path'])-1] != '*'){

			// если такой путь уже есть - удаялем его в том месте где он был ...
			if (in_array($array['path'], $script_paths)) {
				$index = array_search($array['path'], $script_paths);
				unset ($script_paths[$index]);
//				array_splice($script_paths, $index, 1);
				unset ($script_contents[$index]);
//				array_splice($script_contents, $index, 1);
			}

			// и вставляем сейчас. Таким образом сохраняется порядок файлов
			$script_paths[] = $array['path'];
			$script_contents[] = $array['contents'];
		}

		if (count($array['children'])) foreach($array['children'] as $child) parse_map($child, $script_paths, $script_contents);
	}

	// массивы будем передавать по ссылке
	$script_paths = Array();
	$script_contents = Array();

	//$GLOBALS['debug']['$map3'] = $maps[3];

	//обслуживаем меппинги скриптов начиная с конца
	for ($i = count($maps)-1; $i >= 0; $i--) {
		parse_map($maps[$i], $script_paths, $script_contents);
	}

	$GLOBALS['debug']['$script_paths'] = $script_paths;

	// переворачиваем всё
	$script_paths = array_reverse($script_paths);
	$script_contents = array_reverse($script_contents);

	// что отдавать?
	if ($debug) {
		$output = '';
		foreach($script_paths as $path) {
			echo '<script type="text/javascript" language="JavaScript" src="' . $path . '"></script>' . "\n";
		}

	} else {

		$script = join("\n", $script_contents);

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
