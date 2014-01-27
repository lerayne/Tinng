<?php
/**
 * Created by JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 7/11/13
 * Time: 3:34 PM
 * To change this template use File | Settings | File Templates.
 */
//header ("Content-type:text/html;charset=utf-8;");
//mail('myegorov@anromsocial.com', 'test subject', 'test message', "From:Tinng <noreply@tinng.net>");

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
			if (preg_match('/^\s*$/', $buffer)) {
				if ($debug) break;
				else $config_ended = true;
			}

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

		echo $source_path.'<br>';

		while (($file = readdir($dir)) !== false) {

			if (preg_match('/^.*\.js$/', $file)) $includes[] = $file;
			if (is_dir($source_path.'/'.$file) && $file != '.' && $file != '..') $includes[] = $file.'/*';
		}
	}

	// если есть какие-то зависимости - рекурсивно вызываем все указанные
	if (count($includes)){

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

	// выстраивание скриптов и их адресов в нужном порядке (массив выходит перевернутый!)
	function parse_map ($array, &$script_paths, &$script_contents) {

		if ($array['path'][strlen($array['path'])-1] != '*'){
			if (in_array($array['path'], $script_paths)) {
				$index = array_search($array['path'], $script_paths);
				unset ($script_paths[$index]);
				unset ($script_contents[$index]);
			}

			$script_paths[] = $array['path'];
			$script_contents[] = $array['contents'];
		}

		if (count($array['children'])) foreach($array['children'] as $child) parse_map($child, $script_paths, $script_contents);
	}

	// массивы будем передавать по ссыке
	$script_paths = Array();
	$script_contents = Array();

	//обслуживаем меппинги скриптов начиная с конца
	for ($i = count($maps)-1; $i >= 0; $i--) {
		parse_map($maps[$i], $script_paths, $script_contents);
	}

	// переворачиваем всё
	$script_paths = array_reverse($script_paths);
	$script_contents = array_reverse($script_contents);

	// что отдавать?
	if ($debug) {
		$output = '';
		foreach($script_paths as $path) $output .= '<scrpit type="text/javascript" src="'. $path .'"></scrpit>'."\n";
	} else {
		$output = join('', $script_contents);
	}

	return $output;
}

$debug = false;
$maps = Array();

$maps[] = get_script('./web.main/sources/js', 'jqextend.js', $debug);
$maps[] = get_script('..', 'libraries/JsHttpRequest.js', $debug);
$maps[] = get_script('..', 'libraries/jquery-ui-1.10.4.custom.min.js', $debug);
$maps[] = get_script('./web.main/sources/js', 'tinng_init.js', $debug);
$maps[] = get_script('./web.main/sources/js', 'classes/Funcs.js', $debug);

$maps[] = get_script('./web.main/sources/js', 'onload.js', $debug);


$script_paths = get_js($maps, $debug);


header ('Content-type:text/html;charset="utf-8";');

echo '<script>';
echo $script_paths;
echo '</script>';