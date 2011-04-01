-- phpMyAdmin SQL Dump
-- version 3.3.9.2
-- http://www.phpmyadmin.net
--
-- Хост: localhost
-- Время создания: Апр 01 2011 г., 02:37
-- Версия сервера: 5.5.10
-- Версия PHP: 5.3.5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- База данных: `nvcg_topictalk`
--

-- --------------------------------------------------------

--
-- Структура таблицы `jawi_messages`
--

DROP TABLE IF EXISTS `jawi_messages`;
CREATE TABLE IF NOT EXISTS `jawi_messages` (
  `msg_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `msg_author` int(10) unsigned NOT NULL,
  `msg_parent` bigint(20) unsigned DEFAULT NULL,
  `msg_topic_id` bigint(20) unsigned DEFAULT NULL,
  `msg_topic` varchar(255) DEFAULT NULL,
  `msg_body` text NOT NULL,
  `msg_created` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `msg_modified` timestamp NULL DEFAULT NULL,
  `msg_deleted` tinyint(1) unsigned DEFAULT NULL,
  `msg_locked` tinyint(1) unsigned DEFAULT NULL,
  PRIMARY KEY (`msg_id`),
  KEY `msg_parent` (`msg_parent`),
  KEY `msg_author` (`msg_author`),
  KEY `msg_topic_id` (`msg_topic_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=261 ;

--
-- Дамп данных таблицы `jawi_messages`
--

INSERT INTO `jawi_messages` (`msg_id`, `msg_author`, `msg_parent`, `msg_topic_id`, `msg_topic`, `msg_body`, `msg_created`, `msg_modified`, `msg_deleted`, `msg_locked`) VALUES
(87, 1, 77, 77, NULL, 'только ж не сообщение № такой-то, а тема №...', '2011-03-04 18:47:14', NULL, NULL, NULL),
(86, 1, 77, 77, NULL, 'во-от!', '2011-03-04 18:34:08', NULL, NULL, NULL),
(85, 1, 77, 77, NULL, 'Чёто он был пустой    ', '2011-03-04 18:33:32', '2011-03-17 09:56:08', NULL, NULL),
(83, 1, 77, 77, NULL, 'Глянь как можно :)', '2011-03-04 18:29:30', NULL, NULL, NULL),
(78, 1, 77, 77, NULL, 'Сообщение, однако :)', '2010-04-06 11:00:36', NULL, NULL, NULL),
(79, 1, 78, 78, NULL, 'dfgd', '2010-04-06 11:00:52', NULL, NULL, NULL),
(80, 1, 77, 77, NULL, 'Новая месага!', '2011-03-04 18:21:41', NULL, NULL, NULL),
(81, 1, 77, 77, NULL, 'Еще одна!', '2011-03-04 18:24:39', NULL, NULL, NULL),
(82, 1, 77, 77, NULL, 'Ну вот, теперь можно уже более-менее осмысленные вещи делать :)', '2011-03-04 18:25:08', NULL, NULL, NULL),
(76, 1, 0, 0, 'Тема для пустого трепа :)', 'Тут можно пообщаться, наверное :)<br>', '2010-03-26 00:36:39', '2011-03-25 17:26:01', NULL, NULL),
(77, 1, 0, 0, 'Тест длинных тем. Пишем любые сообщения', 'Сообщение 5. Та дам!<br>', '2010-03-26 00:38:45', NULL, NULL, NULL),
(74, 1, 0, 0, 'Тест ветвления (пока приостановлен)<br>', 'Сообщение 3', '2010-03-26 00:31:52', '2011-03-29 11:32:56', NULL, NULL),
(48, 1, 0, 0, 'Обновления', 'Тут я буду писать все существенные обновления движка<br>', '2010-03-24 15:59:00', NULL, NULL, NULL),
(73, 1, 0, 0, 'Ошибки, недоработки, идеи<br>', 'Сюда будем писать что еще нужно сделать<br>', '2010-03-26 00:16:58', '2011-03-25 17:31:44', NULL, NULL),
(88, 1, 77, 77, NULL, 'Это старые названия, тогда тем еще не было, а сообщения от них остались :)', '2011-03-04 18:48:46', NULL, NULL, NULL),
(89, 1, 77, 77, NULL, 'Еще парочка сообщений в этой теме и будет достаточно :)', '2011-03-05 00:28:15', NULL, NULL, NULL),
(90, 1, 77, 77, NULL, 'Например я когда с ноута пишу, у меня уже прокрутка появляется :)', '2011-03-05 00:28:51', NULL, NULL, NULL),
(91, 1, 77, 77, NULL, 'Проба троббера', '2011-03-05 00:33:32', NULL, NULL, NULL),
(92, 1, 77, 77, NULL, 'НЕ получается троббер', '2011-03-05 00:33:45', NULL, NULL, NULL),
(93, 1, 77, 77, NULL, 'Слишком быстро отрабатывает. Надо искуственно замедлить.\n', '2011-03-05 00:35:13', NULL, NULL, NULL),
(94, 1, 77, 77, NULL, 'Попробуем так:\n', '2011-03-05 00:37:05', NULL, NULL, NULL),
(95, 1, 77, 77, NULL, 'Текст с задержкой', '2011-03-05 00:39:25', NULL, NULL, NULL),
(96, 1, 77, 77, NULL, 'Ещё раз', '2011-03-05 00:40:01', NULL, NULL, NULL),
(97, 1, 77, 77, NULL, 'Еще раз', '2011-03-05 00:42:09', NULL, NULL, NULL),
(98, 1, 77, 77, NULL, 'И еще разочек', '2011-03-05 00:43:06', NULL, NULL, NULL),
(99, 1, 77, 77, NULL, 'Как вам такой вариант ?', '2011-03-05 00:43:34', NULL, NULL, NULL),
(100, 1, 77, 77, NULL, 'Пост номер 100, к которому скроллимся<br>', '2011-03-05 01:01:55', '2011-03-17 09:34:21', NULL, NULL),
(101, 1, 77, 77, NULL, 'ну ну ', '2011-03-05 01:02:18', NULL, NULL, NULL),
(102, 1, 77, 77, NULL, 'Это уже ближе к делу', '2011-03-05 01:03:04', NULL, NULL, NULL),
(110, 1, 77, 77, NULL, 'Почему не работают хоткеи в хроме?', '2011-03-05 03:32:45', NULL, NULL, NULL),
(145, 1, 48, 48, NULL, 'Заработало удаление единичных сообщений. Групповое удаление скорее всего будет реализовано с полной перезагрузкой темы<br>', '2011-03-11 13:23:46', NULL, NULL, NULL),
(114, 1, 74, 74, NULL, 'Очень удобный, а главное быстрый визивиг, кстати. :)<br><br>', '2011-03-05 04:10:40', NULL, NULL, NULL),
(119, 1, 77, 77, NULL, 'Наилучшим образом всё устроил :)<br>', '2011-03-05 04:53:05', NULL, NULL, NULL),
(120, 1, 74, 74, NULL, 'Ога, поддерживаю :) ^)<br>', '2011-03-05 12:24:18', '2011-03-18 19:30:23', NULL, NULL),
(121, 1, 77, 77, NULL, 'Но хоткеи в хроме таки надо починить<br>', '2011-03-05 12:45:52', NULL, NULL, NULL),
(122, 1, 77, 77, NULL, 'Охохо! Март 2010!..<br>', '2011-03-06 15:32:41', '2011-03-26 02:14:04', NULL, NULL),
(123, 1, 77, 77, NULL, 'Только <br>', '2011-03-06 15:32:53', NULL, NULL, NULL),
(124, 1, 77, 77, NULL, 'Это кто? Подпишись, пока я регистрацию не сделал :)<br>', '2011-03-08 01:39:27', '2011-03-26 02:13:35', 1, NULL),
(125, 1, 77, 77, NULL, 'Блин! Март! Это же год назад.. <br>Типа весной и осенью - обострения :) у програмеров<br>', '2011-03-08 01:40:16', NULL, NULL, NULL),
(147, 1, 48, 48, NULL, 'Заработало редактирование сообщений<br>', '2011-03-11 14:25:05', NULL, NULL, NULL),
(149, 1, 77, 77, NULL, 'а тут ещё кто-то, кроме нас, пишет? Интерееесно :)<br>', '2011-03-11 20:47:51', NULL, NULL, NULL),
(152, 1, 77, 77, NULL, '<div>Donec libero massa, gravida in pretium a, interdum quis sem. In vulputate gravida turpis, gravida malesuada ligula venenatis nec. Vestibulum vel facilisis lectus. Suspendisse a erat vel mi ullamcorper tempor. Fusce vitae eros odio, a fringilla velit. Sed eu sapien nec leo bibendum egestas. Aenean ornare nisl sed nibh suscipit mattis. Ut sed adipiscing neque. Vestibulum consequat sem vitae velit fringilla ullamcorper. Proin vitae est fringilla turpis ultricies tristique a nec ipsum.</div><div><br></div><div>Sed vel magna sit amet lorem consequat tincidunt. Praesent vel tellus sem. In imperdiet, neque pulvinar ornare scelerisque, tortor dolor pellentesque enim, ut aliquet turpis sem id orci. Cras orci velit, rutrum ac tincidunt eget, gravida a eros. Suspendisse vestibulum ante in quam interdum sodales. Ut consectetur ornare sapien, sed gravida est mollis at. Sed eu orci sem. Nullam tempor magna non velit aliquet sed auctor lacus venenatis. Phasellus interdum semper arcu, at congue sapien hendrerit non. Morbi varius tristique lobortis. Morbi quis eros lorem. Nullam ut nisi est.</div><div><br></div><div style="font-weight: bold;">Сгенерировано 15 абзацев, 1859 слов, 12487 байтов Lorem Ipsum</div>', '2011-03-13 16:41:29', '2011-03-19 20:41:19', NULL, NULL),
(211, 1, 77, 77, NULL, 'и еще 2', '2011-03-18 14:21:58', '2011-03-26 02:16:01', 1, NULL),
(135, 1, 74, 74, NULL, 'Пока отсчитывается 20 секунд, мы тут отправим пост<br>', '2011-03-08 03:01:31', NULL, NULL, NULL),
(136, 1, 74, 74, NULL, 'Ну вот я типа пишу новый пост. Отслеживаю изменения.<br>', '2011-03-08 03:16:57', NULL, NULL, NULL),
(137, 1, 74, 74, NULL, 'Пока получается :)<br>', '2011-03-08 03:21:26', NULL, NULL, NULL),
(138, 1, 74, 74, NULL, 'ЭЙ! Я же написал новый пост. Почему следилка не реагирует?<br>', '2011-03-08 03:22:17', '2011-03-23 23:03:12', NULL, NULL),
(139, 1, 74, 74, NULL, 'угнать за 30 сек<br>', '2011-03-08 03:23:41', NULL, NULL, NULL),
(144, 1, 77, 77, NULL, 'Новое<br>', '2011-03-10 17:08:18', NULL, NULL, NULL),
(222, 1, 73, 73, NULL, 'сделать для активного поля какую-нибудь очевидную индикацию. А то, \nнапример, в новом файрфоксе активное поле никак не выделяется ', '2011-03-20 02:14:58', NULL, NULL, NULL),
(194, 1, 48, 48, NULL, 'Текущая тема загружается не из куки, а из хеша строки запроса (то что после #)<br>Таким образом можно давать ссылки на темы.<br>', '2011-03-16 19:26:38', NULL, NULL, NULL),
(193, 1, 48, 48, NULL, 'Некоторые параметры теперь запоминаются в куках:<br><ul><li>Ширина колонок и их свернутость</li><li style="text-decoration: line-through;">Текущая загруженная тема</li><li>Состояние панели отладки</li></ul>', '2011-03-16 14:48:33', '2011-03-17 10:28:26', NULL, NULL),
(196, 1, 48, 48, NULL, 'По клику на сообщение формируется ссылка на него в адресной строке. Переход по ссылке работает.<br>', '2011-03-17 10:19:11', '2011-03-17 10:28:55', NULL, NULL),
(197, 1, 73, 73, NULL, 'Выделение "активного" сообщения при клике на него. Обеспечить одновременное выделение только одного сообщения (или же стандартной схемы с ctrl, shift). Выделять сообщение при переходе по ссылке на него.<br>', '2011-03-17 10:20:56', '2011-03-20 02:30:36', NULL, NULL),
(198, 1, 73, 73, NULL, 'Сделать возможность ссылаться на определенное место в тексте. В идеале скрипт запоминает и кодирует определенное количество символов начиная от точки начала выделения, а затем при передаче ссылки ищет эту комбинацию в тексте, создает возле нее временный динамический якорь и прокручивает просмотр к нему.<br>', '2011-03-17 10:24:55', NULL, NULL, NULL),
(199, 1, 73, 73, NULL, 'Продумать запоминание текущего места чтения темы пользователем - только для него. Также продумать сочетание работы этого механизма с загрузкой выделенного сообщения из хеша адресной строки<br>', '2011-03-17 10:40:46', NULL, NULL, NULL),
(200, 1, 48, 48, NULL, 'Сообщение можно редактировать двойным кликом на нём<br>', '2011-03-17 10:42:09', NULL, NULL, NULL),
(201, 1, 73, 73, NULL, 'Сделать обработку горячих клавиш. Скорее всего придется делать общий "слушатель" клавиш и в нем писать все возможные варианты.<br>', '2011-03-17 10:42:26', '2011-03-21 16:36:38', NULL, NULL),
(202, 1, 73, 73, NULL, '<span style="font-weight: bold;">!!Важно!!</span><br><br>Сделать наконец механизм регистрации и авторизации, <span style="text-decoration: line-through;">а также автообновлялку</span>, чтобы можно было общаться здесь с другими людьми хотя-бы в линию.<br>', '2011-03-17 10:44:52', '2011-03-25 17:21:03', NULL, NULL),
(203, 1, 48, 48, NULL, 'Реализовал поддержку граватаров и место для аватаров вообще. Аватары в системе используются размером 48*48 пикселей, но в профиле пользователя можно будет увидеть полный размер (100*100 скорее всего)<br>', '2011-03-17 13:27:40', '2011-03-17 13:53:08', NULL, NULL),
(213, 1, 74, 74, NULL, 'Проба<br>', '2011-03-19 16:50:02', NULL, NULL, NULL),
(223, 1, 73, 73, NULL, 'Бага: при добавлении нового сообщения в конец прокрутка не прокручивается до него', '2011-03-20 02:32:26', NULL, NULL, NULL),
(233, 1, 73, 73, NULL, 'По идее прогресс дозагрузки осуществляется довольно быстро. Прогрессбар осуществить можно только тогда, когда дозагрузка осуществляется в несколько ajax-запросов. Если запрос один, прогрессбар можно только симулировать, ибо как скоро браузер получит ответ от сервера - никто не знает, а когда он его получил, обновление контента происходит в считанные милисекунды.<br>', '2011-03-24 12:44:05', '2011-03-25 17:21:48', NULL, NULL),
(232, 1, 73, 73, NULL, '<p>Хотелось бы видеть какие-то сведения о прогрессе «дозагрузки». Ибо смотреть на крутящиеся вещи — занятно только до поры-до времени.</p><p><br></p><p>Это (кстати) одно из того (что раздражает во многих текущих ajax''овых вещах).</p>', '2011-03-24 04:52:36', NULL, NULL, NULL),
(234, 1, 76, 76, NULL, 'Отвечаю', '2011-03-25 15:50:20', '2011-03-25 15:54:45', 1, NULL),
(235, 1, 76, 76, NULL, 'Еще раз отвечаю', '2011-03-25 15:50:59', '2011-03-25 15:52:49', 1, NULL),
(236, 1, 76, 76, NULL, 'Блин, шо за фигня?<div><br></div>', '2011-03-25 15:52:01', '2011-03-25 16:08:47', 1, NULL),
(237, 1, 76, 76, NULL, 'А вот это уже ответ', '2011-03-25 15:55:31', '2011-03-25 17:04:13', 1, NULL),
(238, 1, 76, 76, NULL, 'И еще один ответ', '2011-03-25 16:01:41', '2011-03-25 16:02:47', 1, NULL),
(239, 1, 76, 76, NULL, 'Еще раз, блин!!!!', '2011-03-25 16:06:26', '2011-03-25 16:30:49', 1, NULL),
(240, 1, 76, 76, NULL, 'Добавляем сообщение', '2011-03-25 16:25:42', '2011-03-25 17:03:37', 1, NULL),
(241, 1, 76, 76, NULL, 'Ответ в тему', '2011-03-25 16:31:23', '2011-03-25 17:03:35', 1, NULL),
(242, 1, 76, 76, NULL, 'Какой-то нормальный пост', '2011-03-25 16:34:28', '2011-03-25 17:03:33', 1, NULL),
(243, 1, 76, 76, NULL, '<div>dsfssdsf</div>', '2011-03-25 16:35:13', '2011-03-25 17:03:30', 1, NULL),
(244, 1, 76, 76, NULL, 'Странный баг, но пока не ловится', '2011-03-25 16:35:38', '2011-03-25 17:03:28', 1, NULL),
(245, 1, 76, 76, NULL, 'трампампам', '2011-03-25 17:09:20', '2011-03-25 17:09:36', 1, NULL),
(246, 1, 76, 76, NULL, 'привет, Миша<br>', '2011-03-25 17:11:00', NULL, NULL, NULL),
(247, 1, 76, 76, NULL, 'Так долго писала такое короткое сообщение?<br>', '2011-03-25 17:11:15', NULL, NULL, NULL),
(248, 1, 76, 76, NULL, 'меня таращит. медленно набираю<br>', '2011-03-25 17:11:35', NULL, NULL, NULL),
(249, 1, 76, 76, NULL, 'Шо случилось?<br>', '2011-03-25 17:11:49', NULL, NULL, NULL),
(250, 1, 76, 76, NULL, 'та хз. толи погода, толи заболела(((<br>', '2011-03-25 17:12:15', NULL, NULL, NULL),
(251, 1, 76, 76, NULL, 'Темпаературу померяй :)<br>У нас по моему даже где-то в офисе был градусник<br>', '2011-03-25 17:12:48', NULL, NULL, NULL),
(252, 1, 76, 76, NULL, 'та ладно. уже скоро домой. меня заберут на тачке<br>', '2011-03-25 17:13:24', '2011-03-25 17:14:20', 1, NULL),
(253, 1, 76, 76, NULL, 'Оу. Ну, прикольно, не спорю. <br><br>Слушай, а попробуй сообщение удалить какое нибудь.<br>', '2011-03-25 17:14:00', NULL, NULL, NULL),
(254, 1, 48, 48, NULL, 'Сделал автообновление. Осталось регистрацию/авторизацию и можно тестить<br>', '2011-03-25 17:19:42', NULL, NULL, NULL),
(255, 1, 73, 73, NULL, '1. всплывающие подсказки в меню форматирования текста<br>2. сигнал о полученном сообщении(звуковой или графический)<br>', '2011-03-25 17:20:32', NULL, NULL, NULL),
(256, 1, 73, 73, NULL, 'Спасибо :)<br><br>Еще: увеличение времени ожидания waiter-а когда вкладка неактивна, или браузер свернут.<br>', '2011-03-25 17:22:57', NULL, NULL, NULL),
(257, 1, 76, 76, NULL, 'вфыавыавыаыаы', '2011-03-25 17:28:13', '2011-03-26 02:48:43', 1, NULL),
(258, 1, 76, 76, NULL, 'блабла<br>', '2011-03-25 17:28:22', '2011-03-26 02:48:38', 1, NULL),
(259, 1, 77, 77, NULL, 'Бла бла вап ва пвп вп вапвапвап<br>', '2011-03-26 02:14:29', '2011-03-26 02:17:41', 1, NULL),
(260, 1, 74, 74, NULL, '<div style="text-align: left;">TACENDA - HIDING</div><div><br></div><div>oh, last night I dreamt of a place (land)</div><div>...</div><div>medicine is keeping people sick</div><div>and the tracher''s work is to limit you</div><div><br></div><blockquote class="webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px;">then I woke up,&nbsp;crying out loud<div>broken with all I have known</div><div>''cause they''re showing me things I can live without</div><div>''nd hiding what had to be shown</div><div><br></div><div>I will highlight the things they were hiding tight</div><div><br></div><div>We can highlight the things they were hiding tight</div></blockquote><div><div><br></div></div>', '2011-03-30 13:42:41', '2011-03-31 22:40:23', 1, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `jawi_users`
--

DROP TABLE IF EXISTS `jawi_users`;
CREATE TABLE IF NOT EXISTS `jawi_users` (
  `usr_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usr_login` varchar(16) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `usr_email` varchar(128) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `usr_hash` varchar(128) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `usr_registered` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `usr_approved` tinyint(1) unsigned DEFAULT NULL,
  PRIMARY KEY (`usr_id`),
  UNIQUE KEY `usr_email` (`usr_email`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Дамп данных таблицы `jawi_users`
--

INSERT INTO `jawi_users` (`usr_id`, `usr_login`, `usr_email`, `usr_hash`, `usr_registered`, `usr_approved`) VALUES
(1, 'lerayne', 'lerayne@gmail.com', '062ac7c968833af0f79b2ff4a9de644e', '2010-03-12 15:48:00', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `jawi_user_settings`
--

DROP TABLE IF EXISTS `jawi_user_settings`;
CREATE TABLE IF NOT EXISTS `jawi_user_settings` (
  `uset_user` int(10) unsigned NOT NULL,
  `uset_gravatar` tinyint(1) unsigned NOT NULL DEFAULT '0',
  KEY `user_id` (`uset_user`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `jawi_user_settings`
--

INSERT INTO `jawi_user_settings` (`uset_user`, `uset_gravatar`) VALUES
(1, 1);
