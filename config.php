<?php

// время между запросами на обновление темы (в секундах)
$cfg['posts_updtimer_focused'] = 10;
$cfg['posts_updtimer_blurred'] = 3*60;

// время между запросами на обновление списка тем (в секундах)
$cfg['topics_updtimer_focused'] = 30;
$cfg['topics_updtimer_blurred'] = 5*60;

// Если включено (1) - отображаются все строки консоли, если нет - только необходимые
$cfg['console_display_all'] = 1;

$cfg['cut_length'] = 256;

// переменные массива $cfg напрямую транслируются в javascript и могут быть доступны для просмотра
// пользователем, поэтому для более секретных переменных используется другой массив - $safecfg

// адрес базы данных
$safecfg['db'] = 'mysql://nvcg_main:maedanaena84@localhost/nvcg_topictalk';

// префикс базы даных
$safecfg['db_prefix'] = 'jawi'; // знак "_" вставляется автоматически, указывать его здесь не нужно
?>
