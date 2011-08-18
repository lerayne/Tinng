<?php
/* Файл, к которому обращаются все XHR запросы */

require_once 'php/initial.php';

function databaseErrorHandler($message, $info) {
    //if (!error_reporting()) return;
    echo "SQL Error: $message<br><br><pre>"; print_r($info); echo "</pre>";
    //exit();
}

list($xhr_id, $xhr_method) = split('-', $_GET['JsHttpRequest']);
$sessid = $_GET['PHPSESSID'];

require_once 'libraries/JsHttpRequest.php';
ob_start('ob_gzhandler'); // выводим результат в gzip
$req =& new JsHttpRequest("utf-8");

$result['xhr'] = $xhr_id;
//$result['sessid'] = $sessid;

/*
$log = fopen('ajax_log.txt', 'w+');
function ex ($log){
	fwrite($log, 'process terminated '.connection_status()."\n");
}
register_shutdown_function("ex", $log);
*/

$action = $_REQUEST['action'];
$id = $_REQUEST['id'];

// подготовка каждой строки
function ready_row($row) {
	
	//if ($row['use_gravatar'] == '1')
	$row['avatar_url'] = 'http://www.gravatar.com/avatar/' .md5(strtolower($row['author_email'])).'?s=48';
	
	unset($row['author_email']); // не выводим мыло во избежание спама
	
	// убираем из сообщений об удаленных рядах всю лишнюю инфу
	if ($row['deleted']){
		$cutrow['deleted'] = 1;
		$cutrow['id'] = $row['id'];
		$row = $cutrow;
	}

	return $row;
}


// создание дерева (!! пока не работает)
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


function sort_result($array, $field, $reverse){

	$afs = Array(); // array for sort
	$out = Array();
	
	// сортировка двумерного массива по полю field. Работает даже с неуникальными ключами
	// внимание! возвращает нумерованный массив, а не хеш-таблицу!
	foreach ($array as $key => $val) $afs[$val[$field].$key] = $val;
	ksort($afs);
	if ($reverse) $afs = array_reverse($afs);
	foreach ($afs as $val) $out[] = $val;
	return $out;
}


switch ($action):
	
	// ОСНОВНОЙ ЗАГРУЗЧИК И ОБНОВИТЕЛЬ ДАННЫХ
	case 'load_updates':
		
		$maxdateSQL = $result['old_maxdate'] = jsts2sql($_REQUEST['maxdateTS']);
		
		// Записываем в базу обновления
		$params = $_REQUEST['params'];

		switch ($_REQUEST['write']) {

			// добавляем новую тему тут без брейка!
			case 'add_topic':
				
				$new_row['topic_name'] = $params['title'];
				$result['topic_prop']['new'] = 1;
			
			// вставляем новое сообщение (адаптировать для старта темы!)
			case 'insert_post':

				$new_row['author_id'] = $user->id;
				$new_row['parent_id'] = $_REQUEST['curTopic'];
				$new_row['topic_id'] = $_REQUEST['curTopic'];
				$new_row['message'] = $params['message'];
				$new_row['created'] = date('Y-m-d H:i:s');

				$new_id = $db->query(
					'INSERT INTO ?_messages (?#) VALUES (?a)', array_keys($new_row), array_values($new_row)
				);

				$result['topic_prop']['scrollto'] = $new_id;

			break;

			
			// обновляет запись в ?_messages
			case 'update':

				$upd_id = $params['id'];
				unset($params['id']);
				$params['modified'] = date('Y-m-d H:i:s'); // при любом обновлении пишем дату,
				$params['modifier'] = $user->id; // пользователя, отредактировавшего сообщение
				$params['locked'] = null; // и убираем блокировку

				$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $params, $upd_id);

			break;


			// удаляет сообщение
			case 'delete_post':

				// проверка блокировки сообщения
				$locked = $db->selectCell(
					'SELECT locked FROM ?_messages WHERE id = ?d', $params['id']
				);

				if ($locked){

					$result['error'] = 'post_locked';

				} else {
					
					$upd_id = $params['id'];
					unset($params['id']);
					$params['deleted'] = 1;
					$params['modifier'] = $user->id;
					$params['modified'] = date('Y-m-d H:i:s');
					
					$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $params, $upd_id);
				}

			break;
			
			case 'tag_remove':
				
				$date = date('Y-m-d H:i:s');
				
				$msgupd['modified'] = date('Y-m-d H:i:s');
				$msgupd['modifier'] = $user->id;
				
				$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $msgupd, $params['msg']);
				
				$db->query('DELETE FROM ?_tagmap WHERE message = ?d AND tag = ?d', $params['msg'], $params['tag']);
				
			break;
		}
		
		// ПОИСК ОБНОВЛЕНИЙ
		$result['new_maxdate'] = $db->selectCell (
			'SELECT GREATEST(MAX(created), IFNULL(MAX(modified), 0))
			FROM ?_messages WHERE IFNULL(modified, created) > ?' . ($condition ? ' AND '.$condition : '')
			, ($_REQUEST['write'] == 'load_topic') ? 0 : $maxdateSQL
		);

		// если результатов 0 то отправляем старую макс. дату и сбрасываем case
		
		if (!$result['new_maxdate']){
			$result['new_maxdate'] = $result['old_maxdate'];
			break;
		}
		
		
		// ЧИТАЕМ ИЗМЕНЕИЯ
		
		$sort = $_REQUEST['topicSort'] ? $_REQUEST['topicSort'] : 'updated';
		$reverse = $_REQUEST['tsReverse'];

		// выбираем обновленные темы (втч удаленные)
		$result['topics'] = make_tree($db->select(
			'SELECT
				msg.id AS ARRAY_KEY,
				msg.id,
				LEFT(msg.message, ?d) AS message,
				msg.author_id,
				msg.parent_id,
				msg.topic_name,
				msg.created,
				msg.modified,
				IFNULL(msg.modified, msg.created) AS maxdate,
				msg.deleted,
				usr.email AS author_email,
				usr.login AS author,
				mlast.id AS last_id,
				LEFT(mlast.message, ?d) AS lastpost,
				IFNULL(mlast.modified, mlast.created) AS lastdate,
				GREATEST(IFNULL(msg.modified, msg.created), IFNULL(IFNULL(mlast.modified, mlast.created),0)) as totalmaxd,
				lma.login AS lastauthor,
				(SELECT COUNT(mcount.id) FROM ?_messages mcount WHERE mcount.topic_id = msg.id AND mcount.deleted <=> NULL) AS postsquant,
				IF(unr.timestamp < GREATEST(IFNULL(msg.modified, msg.created), IFNULL(IFNULL(mlast.modified, mlast.created),0)), 1, 0) AS unread
			FROM ?_messages msg
			
			LEFT JOIN ?_users usr 
				ON msg.author_id = usr.id
			LEFT JOIN ?_messages mupd 
				ON mupd.topic_id = msg.id
				AND IFNULL(mupd.modified, mupd.created) =
					(SELECT GREATEST(MAX(mmax.created), MAX(IFNULL(mmax.modified, 0))) FROM ?_messages mmax WHERE mmax.topic_id = msg.id)
			LEFT JOIN ?_messages mlast
				ON mlast.topic_id = msg.id 
				AND mlast.deleted <=> NULL
				AND mlast.id = 
					(SELECT MAX(mmax.id) FROM ?_messages mmax WHERE mmax.topic_id = msg.id AND mmax.deleted <=> NULL)
			LEFT JOIN ?_users lma 
				ON lma.id = mlast.author_id
			LEFT JOIN ?_unread unr
				ON unr.topic = msg.id
				AND unr.user = ?d
				
			WHERE msg.topic_id = 0
				AND (IFNULL(msg.modified, msg.created) > ? OR IFNULL(mupd.modified, mupd.created) > ?)
				'.($condition ? ' AND '.$condition : '')

			, $cfg['cut_length'], $cfg['cut_length'] // ограничение выборки первого поста
			, $user->id
			, $maxdateSQL , $maxdateSQL
		));
		
		
		// выборка тегов
		$tags = $db->select(
			'SELECT
				msg.id AS message,
				tag.id,
				tag.name,
				tag.type
			FROM ?_tagmap map
			LEFT JOIN ?_messages msg 
				ON map.message = msg.id
			LEFT JOIN ?_tags tag
				ON map.tag = tag.id
			WHERE 
				IFNULL(msg.modified, msg.created) > ?
			'.($condition ? ' AND '.$condition : '')
			, $maxdateSQL
		);
		
		foreach ($tags as $tag) {
			$id = $tag['message'];
			
			if ($result['topics'][$id])	$result['topics'][$id]['tags'][] = $tag;
		}
		
		// сортировка. До сортировки массив $result['topics'] имеет индекс в виде номера темы
		switch ($sort):
			
			case 'updated':
				$result['topics'] = sort_result($result['topics'], 'totalmaxd', $reverse);
			break;

		endswitch;
		
		
		// ЕСЛИ В ЗАПРОСЕ УКАЗАНА ТЕМА
		$topic = $_REQUEST['curTopic'];
		
		if ($topic){
			
			if ($_REQUEST['write'] == 'load_topic') {
				$maxdateSQL = jsts2sql($_REQUEST['maxdateTS'] = '0');
				$result['topic_prop']['manual'] = true;
			}

			// проверяем, существует ли тема (не удалена ли) и читаем ее заголовок
			$topic_name = $db->selectCell(
				'SELECT msg.topic_name AS topic FROM ?_messages msg WHERE msg.id = ?d AND msg.deleted <=> NULL'
				, $topic
			);

			if ($topic_name === null){
			// если тема удалена (если удалена, name === null, если пустой заголовок - name === "")

				$result['topic_prop']['deleted'] = true; // по этому флагу отслеживаем онлайн-удаление темы 

			} else {
			// если тема не удалена

				if ($_REQUEST['maxdateTS'] == '0') { // если загружаем новую тему
					
					// выводим номер темы для подсветки ее в колонке тем
					$result['topic_prop']['id'] = $topic;
					
					// хотим узнать, когда пользователь отмечал эту тему прочитанной
					$date_read = $db->selectCell(
						'SELECT timestamp FROM ?_unread WHERE user = ?d AND topic = ?d'
						, $user->id , $topic
					);

					// ой, ни разу! Установить ее прочитанной в этот момент!
					if (!$date_read) {

						$date_read = now('sql');
						$values = Array(
							'user' => $user->id,
							'topic' => $topic,
							'timestamp' => $date_read
						);
						$db->query('INSERT INTO ?_unread (?#) VALUES (?a)'
							, array_keys($values), array_values($values) );

						$date_read = 'firstRead'; // клиент должен знать!
					}

					$result['topic_prop']['date_read'] = $date_read; // вывести в клиент
				}
				
				
				$result['topic_prop']['name'] = $topic_name; // вывод в клиент имени
				
				// выбираем ВСЕ сообщения с более новой датой (даже удаленные)
				$result['posts'] = make_tree($db->select(
					'SELECT
						msg.id,
						msg.message,
						msg.author_id,
						msg.parent_id,
						msg.topic_id,
						msg.topic_name,
						msg.created,
						msg.modified,
						msg.deleted,
						usr.email AS author_email,
						usr.login AS author,
						IF(unr.timestamp < IFNULL(msg.modified, msg.created) && IFNULL(msg.modifier, msg.author_id) != ?d, 1, 0) AS unread,
						modifier,
						moder.login AS modifier_name,
						(SELECT starter.author_id FROM ?_messages starter WHERE starter.id = msg.topic_id ) AS topicstarter
					FROM ?_messages msg
					
					LEFT JOIN ?_users usr 
						ON msg.author_id = usr.id
					LEFT JOIN ?_unread unr
						ON unr.topic = IF(msg.topic_id = 0, msg.id, msg.topic_id) AND unr.user = ?d
					LEFT JOIN ?_users moder
						ON msg.modifier = moder.id

					WHERE
						(msg.topic_id = ?d OR msg.id = ?d)
						AND IFNULL(msg.modified, msg.created) > ?
					ORDER BY msg.created ASC'
					, $user->id, $user->id
					, $topic, $topic
					, $maxdateSQL
				));
			}
		}
			
	break;


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


/*
echo'
<pre>
<b>Request method:</b>'.$_SERVER['REQUEST_METHOD']."\n
<b>Loader used:</b>". $req->LOADER."\n
<b>_REQUEST:</b>". print_r($_REQUEST, 1)."\n
<b>_RESULT:</b> ". print_r($GLOBALS['_RESULT'], 1)."
</pre>";
/*


if(msg_modified > msg_created, 1, 0)
 */
?>