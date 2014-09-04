<?php
/**
 * Created by PhpStorm.
 * User: Michael
 * Date: 30.08.14
 * Time: 8:33
 */

// ИНИЦИАЛИЗАЦИЯ
////////////////

if (!$env) $env = array();
if (!$env['appdir']) $env['appdir'] = '../';
if (!$env['rootdir']) $env['rootdir'] = '../';

// подключение универсального инициализатора (база в нем же)
require_once $env['appdir'].'/sources/php/initial.php';


// ПОДКЛЮЧЕНИЕ ШАБЛОНА
//////////////////////

require_once 'template.php';
?>
