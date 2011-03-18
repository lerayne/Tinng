<?php
/* Файл, к которому обращаются все XHR запросы */

require_once 'initial.php';

/*session_name('uc_ajax');
session_start();*/

function databaseErrorHandler($message, $info)
{
    //if (!error_reporting()) return;
    echo "SQL Error: $message<br><pre>"; print_r($info); echo "</pre>";
    //exit();
}

require_once 'libraries/JsHttpRequest.php';
$req =& new JsHttpRequest("utf-8");

$action = $_REQUEST['action'];
$id = $_REQUEST['id'];

function ready_row($row){
	if ($row['use_gravatar'] == '1')
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

		$result = make_tree($db->select('
			SELECT
				msg_id AS ARRAY_KEY,
				msg_id AS id,
				msg_author AS author_id,
				msg_parent AS parent,
				msg_topic_id AS topic_id,
				msg_topic AS topic,
				msg_body AS message,
				msg_created AS created,
				msg_modified AS modified,
				usr_email AS author_email,
				use_gravatar AS use_gravatar
			FROM ?_messages, ?_users, ?_user_settings
			WHERE
				msg_author = usr_id
				AND (msg_topic_id = ? { OR msg_id = ? })
				AND ?_users.usr_id = ?_user_settings.user_id
			ORDER BY msg_created '.($id == '0' ? 'DESC' : 'ASC')
			, $id
			,($id == '0') ? DBSIMPLE_SKIP : $id
		));

	break;

	// вставляем новое сообщение
	case 'insert_post':
		$message = $_REQUEST['message'];
		$topic = $_REQUEST['topic'];
		$parent = $_REQUEST['parent'];

		$new_row = Array(
			'msg_author' => $user->id,
			'msg_parent' => $parent,
			'msg_topic_id' => $topic,
			'msg_body' => $message,
			'msg_created' => date('Y-m-d H:i:s')
		);

		$new_id = $db->query(
			'INSERT INTO ?_messages (?#) VALUES (?a)',
			array_keys($new_row),
			array_values($new_row)
		);

		$result = ready_row($db->selectRow('
			SELECT
				msg_id AS ARRAY_KEY,
				msg_id AS id,
				msg_author AS author_id,
				msg_parent AS parent,
				msg_topic_id AS topic_id,
				msg_topic AS topic,
				msg_body AS message,
				msg_created AS created,
				msg_modified AS modified,
				usr_email AS author_email,
				use_gravatar
			FROM ?_messages, ?_users, ?_user_settings
			WHERE msg_id = ?
			AND ?_users.usr_id = ?_user_settings.user_id
			'
			, $new_id
		));

	break;

	// ожидаем изменений
	case 'wait_post':

		$begin = time();

		$topic = $_REQUEST['topic'];
		$maxid = $_REQUEST['maxid'];

		$raw = $db->selectCell(
			'SELECT COUNT( * )
			FROM ?_messages
			WHERE
				msg_topic_id = ? AND
				(msg_id > ?d OR msg_created)
			'
			, $topic
			, $maxid
		);

		$result = $raw;
	break;

	// сброс ожидания
	case 'stop_waiting':
		$_SESSION['exit_turmoil'] = 'yes';
		$result = Array('0' => $_SESSION['exit_turmoil']);
	break;

	// обновляем N ячеек в строке
	case 'update':
		$fields = $_REQUEST['fields'];

		foreach ($fields as $key => $val):
			$db->query(
				'UPDATE ?_messages SET ?# = ?, msg_modified = ? WHERE msg_id = ?'
				, $val['field']
				, safe_str($val['data'])
				, date('Y-m-d H:i:s')
				, $id
			);
			$result[$key] = $db->selectRow(
				'SELECT ?#, msg_modified FROM ?_messages WHERE msg_id = ?'
				, $val['field']
				, $id
			);
		endforeach;
	break;

	// удаляем одно сообщение
	case 'delete':
		$result['confirmed'] = $db->query(
			'DELETE FROM ?_messages WHERE msg_id = ?'
			, $id
		);
	break;

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