<?php

// ИНИЦИАЛИЗАЦИЯ
////////////////

$env = array();
$env['appdir'] = 'apps/web.main/';
$env['rootdir'] = '';

// подключение универсального инициализатора (база в нем же)
require_once 'sources/php/initial.php';


// ПОДКЛЮЧЕНИЕ ШАБЛОНА
//////////////////////

require_once $env['appdir'].'sources/php/template.handler.php';
?>