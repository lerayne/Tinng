<?php

// длина обрезки символов в превью в теме
$cfg['cut_length'] = 256;

// сколько сообщений темы загружать за 1 раз
// todo - из-за разделения клиента и сервера хранить этот параметр в конфиге неправильно - он должен передаваться при запросе
$cfg['posts_per_page'] = 20;

// адрес базы данных
//$safecfg['db'] = 'mysql://tinng_main:tinng_demo@localhost/tinng';
$safecfg['db'] = 'mysql://roninpho_tinng:eTgwbRu8Tw2o@localhost/roninpho_tinng2';
//$safecfg['db'] = 'mysql://root:toor@localhost'  /*.':4040'*/  .'/tinng_test';

// в течении какого времени с момента последней активности юзер считается онлайн (сек)
// для корректной работы должно быть больше, чем время поллинга, а так же больше чем время максимально долгого ответа от
// php (т.е. больше 30 секунд)
// todo - здесь явная зависимость между сервером и клиентом, подумать как решить
$cfg['online_threshold'] = 60;

// префикс базы даных
$safecfg['db_prefix'] = 'tinng'; // знак "_" вставляется автоматически, указывать его здесь не нужно