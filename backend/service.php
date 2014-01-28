<?php
require_once './includes/backend_initial.php';

$action = $_REQUEST['action'];
$id = $_REQUEST['id'];

switch ($action):

	case 'batch':

		if (!!$_REQUEST['read_topic']) {
			$read_topics = $_REQUEST['read_topic'];

			foreach ($read_topics as $topic_id => $new_TS):

				$newDate = new DateTime(date('Y-m-d H:i:s', jsts2phpts($new_TS)));
				$new_TS = $newDate->format('U')*1;
				$new_sqldate = $newDate->format('Y-m-d H:i:s');

				// Выясняем, отмечал ли когда-либо пользователь эту тему прочитанной
				$exist = $db->selectRow(
					'SELECT * FROM ?_unread WHERE user = ?d AND topic = ?d'
					, $user->id
					, $topic_id
				);

				if ($exist) {

					$oldDate = new DateTime($exist['timestamp']);
					$old_TS = $oldDate->format('U')+0;

					// Если новая дата позднее предыдущей
					//if ($new_TS > $old_TS):
						$db->query(
							'UPDATE ?_unread SET timestamp = ? WHERE user = ?d AND topic = ?d'
							, $new_sqldate
							, $user->id
							, $topic_id
						);

						$result['read_topic'][$topic_id] = $new_sqldate;
					//endif;

				} else {

					$values = Array(
						'user' => $user->id,
						'topic' => $topic_id,
						'timestamp' => $new_sqldate
					);

					$db->query('INSERT INTO ?_unread (?#) VALUES (?a)', array_keys($values), array_values($values));

					$result['read_topic'][$topic_id] = $new_sqldate;
				}

			endforeach;
		}

	break;

	// пока функция без дела сидит :)
	case 'check':

		//!! в дальнейшем в поле msg_locked нужно будет вписывать, например, идентификатор сессии
		// пользователя, а при проверке спрашивать активна ли еще эта сессия, чтобы избежать
		// "вечного" запирания при вылете пользователя.

		// проверка блокировки сообщения
		$result['locked'] = $db->selectCell(
			'SELECT locked FROM ?_messages WHERE id = ?d', $id
		);

		// проверка наличия непосредственных потомков
		$result['children'] = $db->selectCell(
			'SELECT COUNT( id ) FROM ?_messages WHERE parent_id = ?d', $id
		);

		// является ли сообщение стартовым в теме
		$result['is_topic'] = $db->selectCell(
			'SELECT COUNT( id ) FROM ?_messages WHERE id = ?d AND topic_id = 0', $id
		);

	break;

	// Теперь проверка и блокирование проходят в один заход
	case 'check_n_lock':
		
		$result['locked'] = $db->selectCell(
			'SELECT locked FROM ?_messages WHERE id = ?d', $id
		);
		
		if (!$result['locked'])
			$db->query('UPDATE ?_messages SET locked = ?d WHERE id = ?d', $user->id, $id);
		
	break;

	// разблокировать пост (ничего не возвращает)
	case 'unlock_message':

		$db->query('UPDATE ?_messages SET locked = NULL WHERE id = ?d', $id);

	break;
	
	
	// Пока не используется
	case 'close_session':
	
		//$db->query('UPDATE ?_messages SET msg_locked = NULL WHERE msg_locked = ?d', $user->id);
		
	break;


	// помечаем сообщеие прочитанным
	case 'mark_read':

		$now = now('sql');
		
		// Выясняем, отмечал ли когда-либо пользователь эту тему прочитанной
		$exist = $db->selectRow(
			'SELECT * FROM ?_unread WHERE user = ?d AND topic = ?d'
			, $user->id
			, $id
		);
		
		// Если да - обновляем запись в базе
		if ($exist):
			$db->query(
				'UPDATE ?_unread SET timestamp = ? WHERE user = ?d AND topic = ?d'
				, $now
				, $user->id
				, $id
			);
		// Если нет - забиваем новую запись
		else:

			$values = Array(
				'user' => $user->id,
				'topic' => $id,
				'timestamp' => $now
			);

			$db->query('INSERT INTO ?_unread (?#) VALUES (?a)', array_keys($values), array_values($values));

		endif;
		
		// возвращаем клиенту дату отметки темы прочитанной
		$result = $now;

	break;

	// принимает текстовую строку с тэгами и отдает параметры этих тегов
	case 'get_tags':

		$tags = explode('+', $_REQUEST['tags']);
		$arr = array();

		if (count($tags) && $tags[0] != '') {
			$arr = $db->select('SELECT * FROM ?_tags WHERE name IN (?a)', $tags);
		}

		$result = $arr;

	break;


	// добавляет пользователя в список имеющих доступ к теме
	case 'add_to_private':

		$user_id = $_REQUEST['user_id'];
		$topic_id = $_REQUEST['topic_id'];

		if ($user->id == 0) {
			$result = 'restricted for anonymous';
			break;
		}

		//Приватна ли эта тема сейчас и если да - то какие юзеры к ней были когда-либо допущены?
		$allowed_users = $db->select('
			SELECT pvt.user AS ARRAY_KEY, pvt.deleted
			FROM ?_private_topics pvt
			WHERE pvt.message = ?d
			', $topic_id
		);

		// а какие допущены сейчас?
		$allowed_now = Array();
		foreach($allowed_users as $id => $val) if ($val['deleted'] == null) $allowed_now[] = $id;

//		$GLOBALS['debug']['$user_id'] = $_REQUEST;
//		$GLOBALS['debug']['$user->id'] = $user->id;

//		break;

		if (!count($allowed_now)) {
			// мы впервые делаем тему приватной

			// todo - сделать проверку на право юзера делать тему приватной

			if ($user->id != $user_id) {

				$current_user = Array($topic_id, $user->id);
				$target_user = Array($topic_id, $user_id);

				$db->query(
					'INSERT INTO ?_private_topics (message, user) VALUES (?a), (?a)', $current_user, $target_user
				);
			}

		} else {
			// тема уже приватна и раз юзер ее увидел - доступна ему

			if ($allowed_users[$user_id]['deleted']) {
				// юзер уже ранее был допущен, но был удален
				$db->query(
					'UPDATE ?_private_topics SET deleted = NULL WHERE message = ?d AND user = ?d',
					$topic_id,
					$user_id
				);

			} else {

				$db->query(
					'INSERT INTO ?_private_topics (message, user) VALUES (?d, ?d)', $topic_id, $user_id
				);
			}
		}

		// во всех случаях - помечаем тему обновленной!
		$params = Array(
			'modified' => now('sql'),
			'modifier' => $user->id
		);

		$db->query(
			'UPDATE ?_messages SET ?a WHERE id = ?d', $params, $topic_id
		);

		// получаем данные по юзеру
		$added_user = $db->selectRow('
				SELECT
					usr.id,
					usr.login,
					usr.email,
					usr.display_name,
					avatar.param_value AS avatar
				FROM ?_users usr
				LEFT JOIN ?_user_settings avatar ON avatar.user_id = usr.id AND avatar.param_key = "avatar"
				WHERE usr.id = ?d
				', $user_id
		);

		// todo - повторяю уже третий раз - объединить!
		if ($added_user['avatar'] == 'gravatar') {
			$added_user['avatar'] = 'http://www.gravatar.com/avatar/' . md5(strtolower($added_user['email'])) . '?s=50';
		}

		if ($added_user['display_name'] == null) $added_user['display_name'] = $added_user['login'];

		unset($added_user['email']);

		$result = $added_user;

		break;

	default:

		$result = 'command not found';

endswitch;

$GLOBALS['_RESULT'] = $result;

if (count($GLOBALS['debug'])) var_dump($GLOBALS['debug']);
?>
