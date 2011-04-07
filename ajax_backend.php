<?php
/* Файл, к которому обращаются все XHR запросы */
//$cfg['wait_time'] = 3;

require_once 'config.php';
require_once 'php/initial.php';

//session_name('uc_ajax');
//session_start();

function databaseErrorHandler($message, $info) {
    //if (!error_reporting()) return;
    echo "SQL Error: $message<br><pre>"; print_r($info); echo "</pre>";
    //exit();
}

require_once 'libraries/JsHttpRequest.php';
$req =& new JsHttpRequest("utf-8");

$action = $_REQUEST['action'];
$id = $_REQUEST['id'];

function ready_row($row){
	//if ($row['use_gravatar'] == '1')
	$row['avatar_url'] = 'http://www.gravatar.com/avatar/'.md5(strtolower($row['author_email'])).'?s=48';

	return $row;
}

function make_tree($raw){
	foreach ($raw as $key => $val):
		$raw[$key] = ready_row($val);
		/*if ($val['parent'] == $val['topic_id']) { $result[$key] = $val; }
		else {
			$result[$val['parent']][$key] = $val;
		}*/
	endforeach;
	return $raw;
}

switch ($action):

	// запрашиваем сообщения
	case 'load_posts':

		$result['maxdate'] = $db->selectCell(
			'SELECT GREATEST(MAX(msg_created), IFNULL(MAX(msg_modified),0)) FROM ?_messages
			WHERE msg_id = ? OR msg_topic_id = ?' , $id , $id
		);

		$raw = $db->selectRow(
			'SELECT msg_topic, msg_id FROM ?_messages WHERE msg_id = ?d AND msg_deleted <=> NULL'
			, $id
		);

		$once_read = $db->selectCell(
			'SELECT unr_timestamp FROM ?_unread WHERE unr_user = ?d AND unr_topic = ?d', $user->id , $id
		);

		// если тема читается в первый раз, установить ее прочитанной в этот момент
		if (!$once_read):
			$result['maxread'] = date('Y-m-d H:i:s');
			$values = Array('unr_user' => $user->id, 'unr_topic' => $id, 'unr_timestamp' => $result['maxread']);
			$db->query('INSERT INTO ?_unread (?#) VALUES (?a)', array_keys($values), array_values($values));
		else:
			$result['maxread'] = $once_read;
		endif;

		$result['topic'] = $raw['msg_topic'];
		$published = $raw['msg_id'];

		//!! убрал настройки, три таблицы не выбираются. аватары потом переделать!
		if ($published) $result['data'] = make_tree($db->select(
			'SELECT
				msg_id AS id,
				msg_author AS author_id,
				msg_parent AS parent,
				msg_topic_id AS topic_id,
				msg_topic AS topic,
				msg_body AS message,
				msg_created AS created,
				msg_modified AS modified,
				usr_email AS author_email,
				usr_login AS author
			FROM ?_messages, ?_users
			WHERE
				(msg_topic_id = ?d OR msg_id = ?d)
				AND msg_deleted <=> NULL
				AND `msg_author` = `usr_id`
			ORDER BY msg_created ASC'
			, $id , $id
		));

	break;


	case 'load_topics':

		$result['maxdate'] = $db->selectCell(
			'SELECT GREATEST(MAX(msg_created), IFNULL(MAX(msg_modified),0)) FROM ?_messages
			WHERE msg_topic_id = 0'
		);

		$result['data'] = make_tree($db->select(
			'SELECT
				msg_id AS id,
				msg_author AS author_id,
				msg_parent AS parent,
				msg_topic_id AS topic_id,
				msg_topic AS topic,
				LEFT(msg_body, ?d) AS message,
				msg_created AS created,
				msg_modified AS modified,
				usr_email AS author_email,
				usr_login AS author
			FROM ?_messages, ?_users
			WHERE
				msg_topic_id = 0
				AND msg_deleted <=> NULL
				AND `msg_author` = `usr_id`
			ORDER BY msg_created DESC'
			, $cfg['cut_length'] // ограничение выборки первого поста
		));

		if ($result['data']) foreach ($result['data'] as $key => $val):

			$result['data'][$key]['postcount'] = 1 + $db->selectCell(
				'SELECT COUNT( * ) FROM ?_messages
				WHERE msg_deleted <=> NULL AND msg_topic_id = ?d'
				, $val['id']
			);

			$result['data'][$key]['updated'] = $db->selectCell(
				'SELECT GREATEST(MAX(msg_created), IFNULL(MAX(msg_modified),0))
				FROM ?_messages WHERE msg_topic_id = ?d AND msg_deleted <=> NULL'
				, $val['id']
			);

			$result['data'][$key]['last'] = $db->selectRow(
				'SELECT
					usr_login AS author,
					LEFT(msg_body, ?d) AS message,
					GREATEST(msg_created, IFNULL(msg_modified,0)) AS created
				FROM ?_messages, ?_users
				WHERE
					msg_topic_id = ?d
					AND msg_deleted <=> NULL
					AND `msg_author` = `usr_id`
				ORDER BY msg_created DESC
				LIMIT 1'
				, $cfg['cut_length']
				, $val['id']
			);

		endforeach;

	break;


	// вставляем новое сообщение
	case 'insert_post':

		$message = $_REQUEST['message'];
		$title = $_REQUEST['title'];
		$topic = $_REQUEST['topic'];
		$parent = $_REQUEST['parent'];

		$new_row = Array(
			'msg_author' => $user->id,
			'msg_parent' => $parent,
			'msg_topic_id' => $topic,
			'msg_body' => $message,
			'msg_created' => date('Y-m-d H:i:s')
		);

		if ($title) $new_row['msg_topic'] = $title;

		$new_id = $db->query(
			'INSERT INTO ?_messages (?#) VALUES (?a)', array_keys($new_row), array_values($new_row)
		);

		$result = ready_row($db->selectRow('
			SELECT
				msg_id AS id,
				msg_author AS author_id,
				msg_parent AS parent,
				msg_topic_id AS topic_id,
				msg_topic AS topic,
				msg_body AS message,
				msg_created AS created,
				msg_modified AS modified,
				usr_email AS author_email,
				usr_login AS author
			FROM ?_messages, ?_users
			WHERE msg_id = ?
			AND `msg_author` = `usr_id`'
			, $new_id
		));

	break;



	// ожидаем изменений 
	/*
	case 'long_wait_post':

		$begin = time();
		$wait_time = ini_get('max_execution_time')-5;

		$topic = $_REQUEST['topic'];
		$maxdate = date('Y-m-d H:i:s', substr($_REQUEST['maxdate'], 0, strlen($_REQUEST['maxdate'])-3));

		do {
			$raw = $db->selectCell(
				'SELECT COUNT( * ) AS new
				FROM ?_messages
				WHERE msg_topic_id = ? AND (msg_created > ? OR msg_modified > ?)'
				, $topic , $maxdate , $maxdate
			);
			sleep($cfg['wait_time']);
		} while ($raw == '0' && (time() - $begin) < $wait_time);

		$result = $maxdate.'<br>'.$raw;

	break;
	*/



	// ожидание обновлений постов в текущей теме
	case 'wait_post':

		$topic = $_REQUEST['topic'];

		// форматируем, отнимаем три лишних нолика микросекунд, прилетевшие из js
		$maxdate = date('Y-m-d H:i:s', substr($_REQUEST['maxdate'], 0, strlen($_REQUEST['maxdate'])-3));

		// Выбираем количество измененных файлов
		$number = $db->selectCell(
			'SELECT COUNT( * ) AS new FROM ?_messages
			WHERE (msg_topic_id = ?d OR msg_id = ?d) AND (msg_created > ? OR msg_modified > ?)'
			, $topic , $topic , $maxdate , $maxdate
		);

		// Если кол-во измененных больше 0 ...
		if (intval($number) > 0):

			$result['data'] = make_tree($db->select('
				SELECT
					msg_id AS id,
					msg_author AS author_id,
					msg_parent AS parent,
					msg_topic_id AS topic_id,
					msg_topic AS topic,
					msg_body AS message,
					msg_created AS created,
					msg_modified AS modified,
					msg_deleted AS deleted,
					usr_email AS author_email,
					usr_login AS author
				FROM ?_messages, ?_users
				WHERE
					`msg_author` = `usr_id`
					AND (msg_topic_id = ? OR msg_id = ?)
					AND (msg_created > ? OR msg_modified > ?)'
				, $topic , $topic , $maxdate , $maxdate
			));

			$result['maxdate'] = $db->selectCell(
				'SELECT GREATEST(MAX(msg_created), MAX(msg_modified)) FROM ?_messages
				WHERE msg_id = ? OR msg_topic_id = ?' , $topic , $topic
			);

		endif;

		$result['console'] = $maxdate.' -> '.(!$number ? 0 :$number);

	break;



	// обновляем N ячеек в строке
	case 'update':

		$fields = $_REQUEST['fields'];

		//!! переделать вставку одним запросом с массивами, без foreach

		foreach ($fields as $key => $val):
			$db->query(
				'UPDATE ?_messages SET ?# = ?, msg_modified = ? WHERE msg_id = ?d'
				, $val['field']
				, safe_str($val['data'])
				, date('Y-m-d H:i:s')
				, $id
			);
			$result[$key] = $db->selectRow(
				'SELECT ?#, msg_modified FROM ?_messages WHERE msg_id = ?d'
				, $val['field']
				, $id
			);
		endforeach;

	break;



	case 'lock_post':

		$db->query('UPDATE ?_messages SET msg_locked = ?d WHERE msg_id = ?d', $user->id, $id);

	break;



	case 'unlock_post':

		$db->query('UPDATE ?_messages SET msg_locked = NULL WHERE msg_id = ?d', $id);

	break;



	case 'check':

		//!! в дальнейшем в поле msg_locked нужно будет вписывать, например, идентификатор сессии
		// пользователя, а при проверке спрашивать активна ли еще эта сессия, чтобы избежать
		// "вечного" запирания при вылете пользователя.

		// проверка блокировки сообщения
		$result['locked'] = $db->selectCell(
			'SELECT msg_locked FROM ?_messages WHERE msg_id = ?d', $id
		);

		// проверка налисия непосредственных потомков
		$result['children'] = $db->selectCell(
			'SELECT COUNT( * ) FROM ?_messages WHERE msg_parent = ?d', $id
		);

		// является ли сообщение стартовым в теме
		$result['is_topic'] = $db->selectCell(
			'SELECT COUNT( * ) FROM ?_messages WHERE msg_id = ?d AND msg_topic_id = 0', $id
		);

	break;



	// удаляем одно сообщение
	case 'delete':

		$db->query(
			'UPDATE ?_messages SET msg_deleted = 1, msg_modified = ?
			WHERE msg_id = ?d'
			, date('Y-m-d H:i:s')
			, $id
		);

		$result['maxdate'] = $db->selectCell(
			'SELECT msg_modified FROM ?_messages WHERE msg_id = ?d', $id
		);
		
	break;

	case 'mark_read':

		$now = date('Y-m-d H:i:s');

		$exist = $db->selectRow(
			'SELECT * FROM ?_unread WHERE unr_user = ?d AND unr_topic = ?d'
			, $user->id
			, $id
		);

		if ($exist):
			$db->query(
				'UPDATE ?_unread SET unr_timestamp = ? WHERE unr_user = ?d AND unr_topic = ?d'
				, $now
				, $user->id
				, $id
			);
		else:

			$values = Array(
				'unr_user' => $user->id,
				'unr_topic' => $id,
				'unr_timestamp' => $now
			);

			$db->query('INSERT INTO ?_unread (?#) VALUES (?a)', array_keys($values), array_values($values));

		endif;
		$result = $now;


	break;

	default:

		$result = 'command not found';

endswitch;

$GLOBALS['_RESULT'] = $result;

/*echo'
<pre>
<b>Request method:</b>'.$_SERVER['REQUEST_METHOD']."\n
<b>Loader used:</b>". $req->LOADER."\n
<b>_REQUEST:</b>". print_r($_REQUEST, 1)."\n
<b>_RESULT:</b> ". print_r($GLOBALS['_RESULT'], 1)."
</pre>";*/
?>