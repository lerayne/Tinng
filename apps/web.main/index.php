<?php

// ИНИЦИАЛИЗАЦИЯ
////////////////

$env = array();
$env['appdir'] = 'apps/web.main/';
$env['rootdir'] = './';

// подключение универсального инициализатора (база в нем же)
require_once 'initial.php';

// ПОСТРОЕНИЕ ИНТЕРФЕЙСА
////////////////////////

// установка режима работы в зависимости от устройства
$display_mode = 'desktop';

if (
	strpos($e->uagent, 'Android')
	|| strpos($e->uagent, 'Mobile Safari')
	|| $e->get['mode'] == 'iphone'
)
	$display_mode = 'phone';

$device_path = 'apps/displays/'.$display_mode.'/'.$display_mode.'_';

// ПОДКЛЮЧЕНИЕ ШАБЛОНА
//////////////////////

require_once $device_path.'template_handler.php';
?>