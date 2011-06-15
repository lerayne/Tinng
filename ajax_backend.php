<?php
/* Файл, к которому обращаются все XHR запросы */

require_once 'php/initial.php';

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
function ready_row($row){
	//if ($row['use_gravatar'] == '1')
	$row['avatar_url'] = 'http://www.gravatar.com/avatar/' .md5(strtolower($row['author_email'])).'?s=48';
	unset($row['author_email']); // не выводим мыло во избежание спама

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
		
		// функция достающая новую макс-дату, если обновления есть
		function get_new_maxdate() { 
			global $db, $condition, $maxdateSQL;
			
			$localDateCompare = ($_REQUEST['subAction'] == 'load_topic') ? 0 : $maxdateSQL;
			
			return $db->selectCell (
				'SELECT GREATEST(MAX(created), IFNULL(MAX(modified), 0))
				FROM ?_messages WHERE IFNULL(modified, created) > ?'
				. ($condition ? ' AND '.$condition : '') // забито под условие польз. поиска по темам
				, $localDateCompare
			);
		}
		
		// Если мы что-то пишем - цикл ожидания не запускается. Скорее всего обновления будут, 
		// максимум что нужно - узнать, есть ли они
		if ($_REQUEST['subAction']){
			
			$params = $_REQUEST['params'];
			
			switch ($_REQUEST['subAction']) {
				
				// вставляем новое сообщение (адаптировать для старта темы!)
				case 'insert_post':

					$new_row = Array(
						'author_id' => $user->id,
						'parent_id' => $_REQUEST['curTopic'],
						'topic_id' => $_REQUEST['curTopic'],
						'message' => $params['message'],
						'created' => date('Y-m-d H:i:s')
					);

					if ($params['title']) $new_row['topic_name'] = $params['title'];

					$new_id = $db->query(
						'INSERT INTO ?_messages (?#) VALUES (?a)', array_keys($new_row), array_values($new_row)
					);

					$result['topic_prop']['scrollto'] = $new_id;

				break;
				
				// удаляет сообщение
				case 'delete_post':
					
					// проверка блокировки сообщения
					$locked = $db->selectCell(
						'SELECT locked FROM ?_messages WHERE id = ?d', $params['id']
					);
					
					if ($locked){
						
						$result['error'] = 'post_locked';
						
					} else $db->query(
						'UPDATE ?_messages SET deleted = ?d, modified = ? WHERE id = ?d'
						, $user->id
						, date('Y-m-d H:i:s')
						, $params['id']
					);
					
				break;
			}
			
			$result['new_maxdate'] = get_new_maxdate();
			
		} else {
		// иначе запускаем цикл
			
			$begin = now();
			$wait_time = ini_get('max_execution_time') - $cfg['db_wait_time'] - 2;

			fopen($checkfile = 'data/xhr_session/'.$sessid.'-'.$xhr_id, 'w');

			// ЖДЕМ ИЗМЕНЕНИЙ
			do { 
				if (!file_exists($checkfile)) {/*fopen('data/xhr_session/stop', 'w');*/ die();}

				$result['new_maxdate'] = get_new_maxdate();

				if (!$result['new_maxdate']) sleep($cfg['db_wait_time']); // ждем если ничего не пришло

			} while (!$result['new_maxdate'] && (time() - $begin) < $wait_time); // если нет ответа и не вышло время

			unlink($checkfile);
			
		}
		
		if (!$result['new_maxdate']){
			// если результатов 0 то отправляем старую макс. дату и сбрасываем case
			$result['new_maxdate'] = $result['old_maxdate'];
			break;
		}
		
		
		// РАЗБИРАЕМ ИЗМЕНЕИЯ
		
		$sort = $_REQUEST['topicSort'] ? $_REQUEST['topicSort'] : 'updated';
		$reverse = $_REQUEST['tsReverse'];

		// выбираем обновленные темы (втч удаленные)
		$result['topics'] = make_tree($db->select(
			'SELECT
				msg.id,
				LEFT(msg.message, ?d) AS message,
				msg.author_id,
				msg.parent_id,
				msg.topic_id,
				msg.topic_name,
				msg.created,
				msg.modified,
				IFNULL(msg.modified, msg.created) AS maxdate,
				msg.deleted,
				usr.email AS author_email,
				usr.login AS author,
				LEFT(mlast.message, ?d) AS lastpost,
				IFNULL(mlast.modified, mlast.created) AS lastdate,
				lma.login AS lastauthor,
				(SELECT COUNT(mcount.id) FROM ?_messages mcount 
					WHERE mcount.topic_id = msg.id AND mcount.deleted <=> NULL) AS mquant
			FROM ?_messages msg
			JOIN ?_users usr 
				ON msg.author_id = usr.id
			LEFT JOIN ?_messages mlast
				ON mlast.deleted <=> NULL
				AND mlast.id = (SELECT MAX(mmax.id) FROM ?_messages mmax WHERE mmax.topic_id = msg.id 
								AND mmax.deleted <=> NULL)
			LEFT JOIN ?_users lma ON lma.id = mlast.author_id
			WHERE
				(IFNULL(msg.modified, msg.created) > ? OR IFNULL(mlast.modified, mlast.created) > ?)
				AND msg.topic_id = 0'.
			($condition ? ' AND '.$condition : '')

			, $cfg['cut_length'], $cfg['cut_length'] // ограничение выборки первого поста
			, $maxdateSQL , $maxdateSQL
		));
		
		// необходимо узнать нет ли обновлений среди параметров: 
		// кол-во постов в теме, послений пост, изменение/удаление любого поста в теме. 
		// В данный момент с этим связана трудность - приходится сильно грузить базу запросами. 
		// Пока решаю как есть, в будущем - придумать решение
		
		// выбирем все неудаленные темы (в этом списке удаленные нас не интересуют)
		$selected_topics = $db->select(
			'SELECT id AS ARRAY_KEY, id FROM ?_messages 
			WHERE topic_id = 0 AND deleted <=> NULL'
			. ($condition ? ' AND '.$condition : '')
		);
		// для каждой темы ищем последний пост (если обновлен)
		foreach ($selected_topics as $topic_id => $null){
			
			$common_query = 
				'SELECT
					msg.id,
					LEFT(msg.message, ?d) AS message,
					msg.topic_id,
					msg.created,
					msg.modified,
					msg.deleted,
					IFNULL(msg.modified, msg.created) AS maxdate,
					usr.login AS author
				FROM ?_messages msg, ?_users usr WHERE
					msg.author_id = usr.id';
			
			// тут ошибка! выбирается последнее созданное из обновленных, даже если это не последнее 
			// сообщение в теме! пока это отражается только тем, что при удалении любого сообщения в 
			// теме этот запрос выбирает его, так как у него максимальный modified из всех в теме. 
			// К счастью, следующий обработчик видит этот deleted и передает реально последнее сообщение 
			// в теме, но а) передается избыточное сообщение, б) это может сказаться при редактировании
			// сообщений
			$lastpost = $db->selectRow(
				$common_query.'
					AND msg.topic_id = ?d
					AND IFNULL(msg.modified, msg.created) > ?
				ORDER BY msg.id DESC LIMIT 1'
				, $cfg['cut_length'], $topic_id, $maxdateSQL
			);
			
			// и если он удален - ищем последний актуальный
			if ($lastpost['deleted']){
				
				$result['debug'][$topic_id] 
					= 'the very last for topic '.$topic_id.' (#'.$lastpost['id'].') was deleted';
				
				// этот запрос ищет последнее неудаленное сообщение в теме, вне зависимости от того, 
				// было ли оно обновлено
				$lastpost = $db->selectRow(
					$common_query.'
						AND msg.topic_id = ?d
						AND msg.deleted <=> NULL
					ORDER BY msg.id DESC LIMIT 1'
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
						msg.deleted,
						msg.topic_id,
						IFNULL(msg.modified, msg.created) AS maxdate
					FROM ?_messages msg
					WHERE msg.modified > ?
					AND msg.topic_id = ?d
					ORDER BY msg.modified DESC LIMIT 1'
					, $maxdateSQL, $topic_id
				);
				 
				if ($updated) $result['lastposts'][$topic_id] = $updated;
			}
			
			// если есть хоть какое-то обновление в данной теме - запрашиваем кол-во постов в ней
			if ($result['lastposts'][$topic_id]) {
				$result['lastposts'][$topic_id]['postsquant'] = $db->selectCell(
					'SELECT COUNT(*) FROM ?_messages WHERE (topic_id = ?d OR id = ?d) AND deleted <=> NULL'
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
			
			if ($_REQUEST['subAction'] == 'load_topic') {
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
						usr.login AS author
					FROM ?_messages msg, ?_users usr
					WHERE
						(msg.topic_id = ?d OR msg.id = ?d)
						AND IFNULL(msg.modified, msg.created) > ?
						AND msg.author_id = usr.id
					ORDER BY msg.created ASC'
					, $topic, $topic
					, $maxdateSQL
				));
			}
		}
			
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


	// заблокировать пост (пассивная команда) пока функция без дела сидит :)
	case 'lock_post':
		$db->query('UPDATE ?_messages SET locked = ?d WHERE id = ?d', $user->id, $id);
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


	// удаляем одно сообщение
	/*
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
	*/

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
select jawi_messages.msg_id,
       (select count(jawi_messagesCount.msg_id)  
        from jawi_messages jawi_messagesCount  
        where jawi_messagesCount.msg_topic_id = jawi_messages.msg_id 
              and ifnull(jawi_messagesCount.msg_deleted,0) = 0 ) msgCount,
        jawi_messagesLast.msg_id,
        jawi_messagesLast.msg_created
from jawi_messages left join jawi_messages jawi_messagesLast on jawi_messages.msg_id = jawi_messagesLast.msg_topic_id
                                                            and ifnull(jawi_messagesLast.msg_deleted,0) = 0 
                                                            and jawi_messagesLast.msg_created = (select max(jawi_messagesMax.msg_created) from jawi_messages jawi_messagesMax where jawi_messagesMax.msg_topic_id = jawi_messages.msg_id and ifnull(jawi_messagesMax.msg_deleted,0) = 0)   
                                                           
where jawi_messages.msg_topic_id = 0 and ifnull(jawi_messages.msg_deleted,0) = 0  



if(msg_modified > msg_created, 1, 0)


ifnull(`msg_modified`, `msg_created`) > ?


 */
?>