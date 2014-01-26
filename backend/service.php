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

	default:

		$result = 'command not found';

endswitch;

$GLOBALS['_RESULT'] = $result;

?>
