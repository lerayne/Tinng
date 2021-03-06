<?php

// todo - это к чему? неправильно как-то
$cfg = $env;


// когда установлен (1) - все файлs JS и CSS компилируются в малое количество файлов и обфусцируются
$cfg['production'] = 0;

// когда установлен - доступ есть только у админа
$cfg['maintenance'] = 0;

// Регистрация разрешена?
$cfg['registration_enabled'] = 1;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//$cfg['server_url'] = 'http://dev.srv.tinng.net';
$cfg['server_url'] = 'http://localhost/tinngserv-php';

$cfg['appdir'] = $env['appdir'];

// промежуток между запросами short-poll (в миллисекундах)
$cfg['poll_timer'] = 15000;

// то же самое для неактивного окна
$cfg['poll_timer_blurred'] = 60000;

// таймаут xhr-подсказок
$cfg['xhr_suggest'] = 400;

// время, после которого время ожидания запроса будет считаться длинным для восприятия и будет выводиться троббер
$cfg['xhr_lag'] = 200;

// Если включено (1) - отображаются все строки консоли, если нет - только необходимые
$cfg['console_display_all'] = 1;

// скин
$cfg['skin'] = 'clarity';

// todo выводить ответ от сервера с этой переменной, убрать из конфига клиента
// сколько сообщений темы загружать за 1 раз
$cfg['posts_per_page'] = 50;

$cfg['logging'] = 0;

// Название инсталляции
$cfg['instance_name'] = 'Tinng-нестабильный';

// в течении какого времени с момента последней активности юзер считается онлайн (сек)
$cfg['online_threshold'] = 300;

// переменные массива $cfg напрямую транслируются в javascript и могут быть доступны для просмотра
// пользователем, поэтому для более секретных переменных используется другой массив - $safecfg

// адрес базы данных
//$safecfg['db'] = 'mysql://tinng_main:tinng_demo@localhost/tinng';
//$safecfg['db'] = 'mysql://roninpho_tinng:eTgwbRu8Tw2o@localhost/roninpho_tinng2';
$safecfg['db'] = 'mysql://root:toor@localhost/tinng_test';

// префикс базы даных
$safecfg['db_prefix'] = 'tinng'; // знак "_" вставляется автоматически, указывать его здесь не нужно

// На этот email будут отправляться сообщения админу
$safecfg['admin_email'] = 'lerayne@gmail.com';

// Имейл, от которого будут приходить письма
$safecfg['instance_email'] = 'noreply@tinng.net';

// Авторизация через "вконтакте"
$safecfg['vk_app_id'] = '3767832';
$safecfg['vk_secret_key'] = 'aFietr8akXBn9wweMpum';
?>
