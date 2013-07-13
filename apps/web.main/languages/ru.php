<?php
$txt['header_menu'] = 'Меню';
$txt['header_topics'] = 'Темы';
$txt['header_posts'] = 'Сообщения';
$txt['of_the_topic'] = 'темы';
$txt['topic'] = 'Тема';
$txt['modified'] = 'изменено ';
$txt['postsquant'] = ' сообщ.';
$txt['new_topic'] = 'Новая тема';
$txt['lastpost'] = 'Последнее: ';
$txt['msgs'] = ' сообщ.';

$txt['from'] = '';
$txt['topicstarter'] = 'автор темы';

$txt['edit'] = 'Правка';
$txt['delete'] = 'Удалить';
$txt['unblock'] = 'Разблокировать';

$txt['explain_addbranch'] = 'Ответить на это сообщение';
$txt['explain_plainanswer'] = 'Ответить на это сообщение';
$txt['explain_editmessage'] = 'Редактировать сообщение';
$txt['explain_deletemessage'] = 'Удалить сообщение';

$txt['while_you_wrote'] = 'Пока вы набирали сообщение, содержание темы изменилось. Сообщение не было отправлено.';

$txt['how_to_send_post'] = 'Вы также можете отправить сообщение, нажав Ctrl+Enter, или Alt+Enter';

$txt['not_authd_to_post'] = 'Войдите или зарегистрируйтесь, чтобы писать';

$txt['will_reply_to'] = 'Cообщение будет ответом на выделенное: ';
$txt['cancel_selection'] = 'Снять выделение';
$txt['scroll_to_selected'] = 'Показать';
$txt['show_parent'] = 'Это ответ на другое сообщение (показать)';

$txt['cancel'] = 'Отмена';
$txt['cancel_new_topic'] = 'Отмена создания темы';
$txt['send'] = 'Отправить';
$txt['save'] = 'Сохранить';
$txt['answer'] = 'Ответить';
$txt['rename'] = 'Переименовать';
$txt['rename_topic'] = 'Переименовать тему';

$txt['error_missing_msg_body'] = 'Ошибка! Сообщение не может быть пустым';
$txt['no_topic_name'] = '<span class="subtext">Без названия</span>';

$txt['msg_del_confirm'] = 'Это сообщение будет удалено. Продолжить?';
$txt['topic_del_confirm'] = 'Тема и все сообщения в ней будут удалены. Продолжить?';
$txt['post_locked'] = "Это сообщение заблокировано. \\nСкорее всего - в данный момент его кто-то редактирует\\n";
$txt['post_locked_admin'] = 'Вы можете разблокировать сообщение принудительно (не рекомендуется)';

$txt['login_name'] = 'Логин или email:';
$txt['login_pass'] = 'Пароль:';
$txt['login_memorize'] = 'Запомнить';
$txt['login_btn'] = 'Вход';
$txt['login_logout'] = 'Выход';
$txt['login_reg'] = 'Регистрация';

$txt['title_register'] = 'Регистрация нового пользователя';
$txt['title_message'] = 'Сообщение:';

$txt['reg_login'] = 'Логин';
$txt['reg_email'] = 'email';
$txt['reg_pass1'] = 'Пароль';
$txt['reg_pass2'] = 'Повтор пароля';
$txt['reg_quiz'] = 'Загадка';
$txt['reg_answer'] = 'Ответ';
$txt['reg_reg'] = 'Зарегистрироваться';

$txt['btn_newtopic'] = 'Новая тема';
$txt['btn_markread'] = 'Отметить тему прочитанной';

$txt['show_more'] = 'Предыдущие '.$cfg['posts_per_page'];
$txt['show_all'] = 'Показать все';

$txt['login_to_write'] = 'Войдите или <a href="javascript:t.ui.showRegForm()">зарегистриуйтесь</a>, чтобы писать';

$txt['ajax_error_login'] = 'Логин занят!';
$txt['ajax_error_email'] = 'e-mail занят!';

$txt['ret_message_1'] = $txt['ret_message_login_failure'] = 'Неправильный логин или пароль. Возможно, такого пользователя не существует';
$txt['ret_message_10'] = $txt['ret_message_wrong_password'] = 'Вы неправильно ввели пароль';
$txt['ret_message_11'] = $txt['ret_message_password_mismatch'] = 'Пароли не совпадают';
$txt['ret_message_12'] = $txt['ret_message_wrong_email'] = 'Неправильно введен email';
$txt['ret_message_13'] = $txt['ret_message_wrong_login'] = 'Неправильно введен логин';
$txt['ret_message_14'] = $txt['ret_message_wrong_antibot'] = 'Вы неправильно ответили на загадку';
$txt['ret_message_15'] = $txt['ret_message_user_exists'] = 'Пользователь с таким логином и/или email уже существует';
$txt['ret_message_16'] = $txt['ret_message_activation_no_user'] = 'Не найдена запись, ожидающая одобрения. Возможно, вы уже активировали ее';
$txt['ret_message_17'] = $txt['ret_message_activation_wrong_token'] = 'Ключ активации неверен';

$txt['ret_message_20'] = $txt['ret_message_registration_success'] = 'Регистрация прошла успешно. На ваш e-mail отправлено письмо, с активационной ссылкой';
$txt['ret_message_21'] =  $txt['ret_message_activation_success'] = 'Аккаунт успешно активирован. Поздравляем, вы авторизированы в системе';

$txtp['reg_login_expalin'] = 'Логин может содержать только латинские буквы, цифры, точку и знак "_". Длина логина -
	от 4 до 24 символов';

$txtp['reg_pass_expalin'] = 'Пароли должны совпадать и иметь от 6 до 32 символов. Для большей безопасности пароля
	используйте в нем символы в разных регистрах и цифры. На данный момент ограничения по символам пароля такие же, как
	и для логина. В финальной версии это ограничение будет снято.';

$txtp['reg_email_expalin'] = 'email должен быть реальным. На него вам придет письмо, при помощи
	которого вы сможете активировать аккаунт.<br>Мы также поддерживаем сервис
	<a  tabindex="-1" target="_blank"  href="http://www.gravatar.com">gravatar</a>, при помощи которого вы можете привязать свой
	аватар к данному email-адресу. Другого способа залить аватар у нас пока нет, sorry :)';


$txtp['posts_default'] = 'Выберите тему в столбце слева';

$txtp['reg_approve_subject'] = 'Подтверждение аккаунта Tinng';
$txtp['reg_approve_message'] = ', Вы успешно зарегистрировались в системе Tinng.
Чтобы активировать ваш аккаунт,	перейдите по этой ссылке: ';

$txtp['reg_welcome_subject'] = 'Добро пожаловать на Tinng';
$txtp['reg_welcome_message'] = ', Вы успешно зарегистрировались и активировали аккаунт в системе Tinng. Приятного общения!';

$quiz[0]['body'] = 'Сидит дед, во сто шуб одет. Кто его раздевает, тот слезы ...';
$quiz[0]['answer'] = 'проливает';

$quiz[1]['body'] = 'В лесу родилась елочка, в лесу она росла, зимой и летом стройная, зеленая ...';
$quiz[1]['answer'] = 'была';

$quiz[2]['body'] = 'Куда ты тропинка меня привела? Без милой принцессы мне жизнь не ...';
$quiz[2]['answer'] = 'мила';

$quiz[3]['body'] = 'Без окон, без дверей - полна горница ...';
$quiz[3]['answer'] = 'людей';

?>
