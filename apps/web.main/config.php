<?php

$cfg = $env;

// промежуток между запросами short-poll (в миллисекундах)
$cfg['poll_timer'] = 5000;

// то же самое для неактивного окна (в проекте)
$cfg['poll_timer_blurred'] = 3*60000; 

// Если включено (1) - отображаются все строки консоли, если нет - только необходимые
$cfg['console_display_all'] = 1;

// скин
$cfg['skin'] = 'clarity';

// todo выводить ответ от сервера с этой переменной, убрать из конфига клиента
// сколько сообщений темы загружать за 1 раз
$cfg['posts_per_page'] = 20;

$cfg['logging'] = 0;

// Название инсталляции
$cfg['instance_name'] = 'Tinng-нестабильный';

// переменные массива $cfg напрямую транслируются в javascript и могут быть доступны для просмотра
// пользователем, поэтому для более секретных переменных используется другой массив - $safecfg

// адрес базы данных
$safecfg['db'] = 'mysql://tinng_main:maedanaena884@localhost/tinng';

// префикс базы даных
$safecfg['db_prefix'] = 'tinng'; // знак "_" вставляется автоматически, указывать его здесь не нужно

// когда установлен (1) - все файлs JS (а в будущем и CSS) компилируются в малое 
// количество файлов и обфусцируются
$safecfg['production'] = 0;

// На этот email будут отправляться сообщения админу
$safecfg['admin_email'] = 'lerayne@gmail.com';

// Имейл, от которого будут приходить письма
$safecfg['instance_email'] = 'noreply@tinng.net';

// Авторизация через "вконтакте"
$safecfg['vk_app_id'] = '3767832';
$safecfg['vk_secret_key'] = 'aFietr8akXBn9wweMpum';
?>
