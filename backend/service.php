<?php
require_once 'initial.php';

$action = $_REQUEST['action'];
$id = $_REQUEST['id'];

switch ($action):

	// разблокировать пост (пассивная команда)
	case 'unlock_post':
		
		$db->query('UPDATE ?_messages SET locked = NULL WHERE id = ?d', $id);
		
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


	case 'check_n_lock':
		
		$result['locked'] = $db->selectCell(
			'SELECT locked FROM ?_messages WHERE id = ?d', $id
		);
		
		if (!$result['locked'])
			$db->query('UPDATE ?_messages SET locked = ?d WHERE id = ?d', $user->id, $id);
		
	break;
	
	
	
	case 'close_session':
	
		//$db->query('UPDATE ?_messages SET msg_locked = NULL WHERE msg_locked = ?d', $user->id);
		
	break;


	// помечаем сообщеие прочитанным
	case 'mark_read':

		$now = date('Y-m-d H:i:s');

		$exist = $db->selectRow(
			'SELECT * FROM ?_unread WHERE user = ?d AND topic = ?d'
			, $user->id
			, $id
		);

		if ($exist):
			$db->query(
				'UPDATE ?_unread SET timestamp = ? WHERE user = ?d AND topic = ?d'
				, $now
				, $user->id
				, $id
			);
		else:

			$values = Array(
				'user' => $user->id,
				'topic' => $id,
				'timestamp' => $now
			);

			$db->query('INSERT INTO ?_unread (?#) VALUES (?a)', array_keys($values), array_values($values));

		endif;
		
		$result = $now;

	break;

	default:

		$result = 'command not found';

endswitch;

$GLOBALS['_RESULT'] = $result;

?>
