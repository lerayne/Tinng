<?php

// ИНИЦИАЛИЗАЦИЯ
////////////////

if (!$env) $env = array();
if (!$env['appdir']) $env['appdir'] = '';
if (!$env['rootdir']) $env['rootdir'] = '';

// подключение универсального инициализатора (база в нем же)
require_once $env['appdir'].'sources/php/initial.php';


// ПОДКЛЮЧЕНИЕ ШАБЛОНА
//////////////////////

require_once $env['appdir'].'sources/php/template.handler.php';
?>