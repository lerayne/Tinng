<?php

// ИНИЦИАЛИЗАЦИЯ
////////////////

$env = array();
$env['appdir'] = 'apps/web.main/';
$env['rootdir'] = '';

// подключение универсального инициализатора (база в нем же)
require_once 'initial.php';


// ПОДКЛЮЧЕНИЕ ШАБЛОНА
//////////////////////

require_once $env['appdir'].'template.handler.php';
?>