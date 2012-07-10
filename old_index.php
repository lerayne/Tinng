<?php

// ИНИЦИАЛИЗАЦИЯ
////////////////

// подключение универсального инициализатора (база в нем же)
$rootdir = './';
require_once 'php/initial.php';

// ПОСТРОЕНИЕ ИНТЕРФЕЙСА
////////////////////////

$columns = array (
    #'menu',
    'topics',
    'posts'
);

// установка режима работы в зависимости от устройства
$display_mode = 'desktop';

if (
    strpos($e->uagent, 'Android')
    || strpos($e->uagent, 'Mobile Safari')
    || $e->get['mode'] == 'iphone'
)
    $display_mode = 'phone';

$device_path = 'displays/'.$display_mode.'/'.$display_mode.'_';

//работа с сессией
# session_start();

// ПОДКЛЮЧЕНИЕ ШАБЛОНА
//////////////////////

// todo в новом интерфейсе не работает логин
// todo без логина не работает загрузка

require_once $device_path.'template_handler_jq.php';
//require_once $device_path.'template_handler.php';
?>