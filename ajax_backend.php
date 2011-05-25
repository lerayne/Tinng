<?php
/* Файл, к которому обращаются все XHR запросы */

require_once 'config.php';
require_once 'php/initial.php';

//session_name('uc_ajax');
//session_start();

function databaseErrorHandler($message, $info) {
    //if (!error_reporting()) return;
    echo "SQL Error: $message<br><pre>"; print_r($info); echo "</pre>";
    //exit();
}

list($xhr_id, $xhr_method) = split('-', $_GET['JsHttpRequest']);
$sessid = $_GET['PHPSESSID'];

require_once 'libraries/JsHttpRequest.php';
ob_start('ob_gzhandler'); // выводим результат в gzip
$req =& new JsHttpRequest("utf-8");

$result['xhr'] = $xhr_id;
$result['sessid'] = $sessid;

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
function ready_row($row){
	//if ($row['use_gravatar'] == '1')
	$row['avatar_url'] = 'http://www.gravatar.com/avatar/'.md5(strtolower($row['author_email'])).'?s=48';

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
	foreach ($array as $key => $val) $afs[$val[$field].$key] = $val;
	ksort($afs);
	if ($reverse) $afs = array_reverse($afs);
	foreach ($afs as $val) $out[] = $val;
	return $out;
}

switch ($action):
	
	// ОСНОВНОЙ ЗАГРУЗЧИК И ОБНОВИТЕЛЬ ДАННЫХ
	case 'load_updates':

		$begin = now();
		$wait_time = ini_get('max_execution_time') - $cfg['db_wait_time'] - 2;
		
		$maxdateSQL = $result['old_maxdate'] = jsts2sql($_REQUEST['maxdateTS']);
		
		$checkfile = 'data/xhr_session/'.$sessid.'-'.$xhr_id;
		fopen($checkfile, 'w');
		
		// ЖДЕМ ИЗМЕНЕНИЙ
		do { if (!file_exists($checkfile)) die();
			
			$changes_q = $_REQUEST['loadTopic'] ? 1 : $db->selectCell(
				'SELECT COUNT( * ) FROM ?_messages WHERE (msg_created > ? OR msg_modified > ?)'
				. ($condition ? ' AND '.$condition : '') // забито под условие польз. поиска по темам
				, $maxdateSQL , $maxdateSQL
			);
			
			if ($changes_q == '0') sleep($cfg['db_wait_time']); // ждем если ничего не пришло
			
		} while ($changes_q == '0' && (time() - $begin) < $wait_time); // если нет ответа и не вышло время
		
		unlink($checkfile);
		
		if ($changes_q == '0'){
			// если результатов 0 то отправляем старую макс. дату и сбрасываем case
			$result['new_maxdate'] = $result['old_maxdate'];
			break;
		}
		
		
		// РАЗБИРАЕМ ИЗМЕНЕИЯ
		
		$sort = $_REQUEST['topicSort'] ? $_REQUEST['topicSort'] : 'updated';
		$reverse = $_REQUEST['tsReverse'];

		// новая максимальная дата (скорее всего от этого лишнего запроса можно избавиться)
		$result['new_maxdate'] = $db->selectCell(
			'SELECT GREATEST(MAX(msg_created), IFNULL(MAX(msg_modified), 0)) FROM ?_messages'
			. ($condition ? ' WHERE '.$condition : '') // забито под условие польз. поиска по темам
		);
		
		// количество обновленных строк (это не кол-во новых транзакций!)
		$result['changes_quant'] = $changes_q;

		// выбираем обновленные темы (втч удаленные)
		$result['topics'] = make_tree($db->select(
			'SELECT
				msg_id AS id,
				msg_author AS author_id,
				msg_parent AS parent,
				msg_topic_id AS topic_id,
				msg_topic AS topic,
				LEFT(msg_body, ?d) AS message,
				msg_created AS created,
				msg_modified AS modified,
				GREATEST(msg_created, IFNULL(msg_modified, 0)) AS maxdate,
				msg_deleted AS deleted,
				usr_email AS author_email,
				usr_login AS author
			FROM ?_messages, ?_users
			WHERE
				(msg_created > ? OR msg_modified > ?)
				AND msg_topic_id = 0
				AND `msg_author` = `usr_id`'.
			($condition ? ' AND '.$condition : '')

			, $cfg['cut_length'] // ограничение выборки первого поста
			, $maxdateSQL , $maxdateSQL
		));
		
		// необходимо узнать нет ли обновлений среди параметров: 
		// кол-во постов в теме, послений пост, изменение/удаление любого поста в теме. 
		// В данный момент с этим связана трудность - приходится сильно грузить базу запросами. 
		// Пока решаю как есть, в будущем - придумать решение
		
		// выбирем все неудаленные темы (в этом списке удаленные нас не интересуют)
		$selected_topics = $db->select(
			'SELECT msg_id AS ARRAY_KEY, msg_id FROM ?_messages 
			WHERE msg_topic_id = 0 AND msg_deleted <=> NULL'
			. ($condition ? ' AND '.$condition : '')
		);
		// для каждой темы ищем последний пост (если обновлен)
		foreach ($selected_topics as $topic_id => $null){
			$lastpost = $db->selectRow(
				'SELECT
					msg_id AS id,
					msg_topic_id AS topic_id,
					LEFT(msg_body, ?d) AS message,
					msg_created AS created,
					msg_modified AS modified,
					msg_deleted AS deleted,
					GREATEST(msg_created, IFNULL(msg_modified,0)) AS maxdate,
					usr_login AS author
				FROM ?_messages, ?_users WHERE
					`msg_author` = `usr_id`
					AND msg_topic_id = ?d
					AND (msg_created > ? OR msg_modified > ?)
				ORDER BY msg_id DESC LIMIT 1'
				, $cfg['cut_length'], $topic_id, $maxdateSQL, $maxdateSQL
			);
			
			// и если он удален - ищем последний актуальный
			if ($lastpost['deleted']){
				$lastpost = $db->selectRow(
					'SELECT
						msg_id AS id,
						msg_topic_id AS topic_id,
						LEFT(msg_body, ?d) AS message,
						msg_created AS created,
						msg_modified AS modified,
						msg_deleted AS deleted,
						GREATEST(msg_created, IFNULL(msg_modified,0)) AS maxdate,
						usr_login AS author
					FROM ?_messages, ?_users WHERE
						`msg_author` = `usr_id`
						AND msg_topic_id = ?d
						AND msg_deleted <=> NULL
					ORDER BY msg_id DESC LIMIT 1'
					, $cfg['cut_length'], $topic_id
				);
			}
			
			// если обновление последнего сообщения найдено, "пустых" обновлений не искать
			if ($lastpost) {
				
				$result['lastposts'][$topic_id] = $lastpost;
				
			} else {
			// но если не найдено - проверить, вдруг есть?
				
				$updated = $db->selectRow(
					'SELECT 
						msg_deleted,
						msg_topic_id AS topic_id,
						GREATEST(msg_created, IFNULL(msg_modified,0)) AS maxdate
					FROM ?_messages 
					WHERE msg_modified > ?
					ORDER BY msg_modified DESC LIMIT 1'
					, $maxdateSQL
				);
				 
				if ($updated) $result['lastposts'][$topic_id] = $updated;
			}
			
			// если есть хоть какое-то обновление в данной теме - запрашиваем кол-во постов в ней
			if ($result['lastposts'][$topic_id]) {
				$result['lastposts'][$topic_id]['postsquant'] = $db->selectCell(
					'SELECT COUNT(*) FROM ?_messages WHERE msg_topic_id = ?d OR msg_id = ?d'
					, $topic_id, $topic_id
				);
			}

		}
		
		
		// пока оставляем так, над сортировкой поработать!
		switch ($sort):
			
			case 'updated':
				$result['topics'] = sort_result($result['topics'], 'maxdate', $reverse);
				$result['lastposts'] = sort_result($result['lastposts'], 'maxdate', !$reverse);
			break;

		endswitch;

		
		// ЕСЛИ В ЗАПРОСЕ УКАЗАНА ТЕМА
		if (($topic = $_REQUEST['curTopic'])){ // да, тут действительно присвоение
			
			if ($_REQUEST['loadTopic']) $maxdateSQL = jsts2sql($_REQUEST['maxdateTS'] = '0');

			// проверяем, существует ли тема (не удалена ли) и читаем ее заголовок
			$topic_name = $db->selectCell(
				'SELECT msg_topic FROM ?_messages WHERE msg_id = ?d AND msg_deleted <=> NULL'
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
						'SELECT unr_timestamp FROM ?_unread WHERE unr_user = ?d AND unr_topic = ?d'
						, $user->id , $topic
					);

					// ой, ни разу! Установить ее прочитанной в этот момент!
					if (!$date_read) {

						$date_read = now('sql');
						$values = Array(
							'unr_user' => $user->id,
							'unr_topic' => $topic,
							'unr_timestamp' => $date_read
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
						(msg_topic_id = ?d OR msg_id = ?d)
						AND (msg_created > ? OR msg_modified > ?)
						AND `msg_author` = `usr_id`
					ORDER BY msg_created ASC'
					, $topic, $topic
					, $maxdateSQL, $maxdateSQL
				));
			}
		}
			
	break;
	
	
	// стираем файл, который необходим для работы ожидающего цикла
	case 'stop_waiting':
		unlink('data/xhr_session/'.$_REQUEST['file']);
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


	// заблокировать пост (пассивная команда)
	case 'lock_post':
		$db->query('UPDATE ?_messages SET msg_locked = ?d WHERE msg_id = ?d', $user->id, $id);
	break;


	// разблокировать пост (пассивная команда)
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


	// помечаем сообщеие прочитанным
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