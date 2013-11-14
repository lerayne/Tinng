<?php
//sleep(1); // в целях отладки

require_once './includes/backend_initial.php';

$result['xhr'] = $xhr_id;
//$result['sessid'] = $sessid;

/* // Запись в лог
$log = fopen('ajax_log.txt', 'w+');
function ex ($log){
	fwrite($log, 'process terminated '.connection_status()."\n");
}
register_shutdown_function("ex", $log);
*/

////////////////////////////////
// Функции для этой части движка
////////////////////////////////

// подготовка каждой строки
function ready_row($row)
{

	// убираем из сообщений об удаленных рядах всю лишнюю инфу
	if ($row['deleted']) {

		$cutrow['deleted'] = 1;
		$cutrow['id'] = $row['id'];
		$cutrow['author'] = $row['author'];
		$cutrow['created'] = $row['created'];
		unset($row);
		$row = $cutrow;

	} else { // Если работаем не с отчетом об удалении 

		if ($row['author_avatar'] == 'gravatar'){
			$row['author_avatar'] = 'http://www.gravatar.com/avatar/' . md5(strtolower($row['author_email'])) . '?s=48';
		}

		unset($row['author_email']); // не выводим мыло в аякс-переписке
	}

	return $row;
}


// создание дерева (внимание !! целесообразность ветвления - под вопросом)
// сейчас используется для подготовки всех опций
function make_tree($raw)
{
	foreach ($raw as $key => $val):
		$raw[$key] = ready_row($val);
		/*if ($val['parent'] == $val['topic_id']) { $result[$key] = $val; }
		else {
			$result[$val['parent']][$key] = $val;
		}*/
	endforeach;
	return $raw;
}

// сортировка двумерного массива по указанному полю field. Работает даже с неуникальными ключами
// внимание! возвращает нумерованный массив, а не хеш-таблицу!
function sort_by_field($array, $field, $reverse)
{

	$afs = Array(); // array for sort
	$out = Array();

	foreach ($array as $key => $val) $afs[$val[$field] . $key] = $val;
	ksort($afs);
	if ($reverse) $afs = array_reverse($afs);
	foreach ($afs as $val) $out[] = $val;
	return $out;
}


/////////////////////////////////
// Импорт и подготовка переменных
/////////////////////////////////

$id = $_REQUEST['id']; // универсальный указатель номера записи

$maxdateSQL = jsts2sql($_REQUEST['maxdateTS']);
$old_pglimdateTS = $_REQUEST['pglimdateTS'];

$action = $_REQUEST['action']; // указывает что именно пишем, если не false
$params = $_REQUEST['params']; // прочие передаваемые данные (например новые данные для записи)
$topic = $_REQUEST['curTopic'];
$filter_query = $_REQUEST['filterQuery']; // строка фильтрации списка тем
$test = $_REQUEST['test'];


$result['old_maxdate'] = $maxdateSQL;


///////////////////////////////
// Записываем в базу обновления
///////////////////////////////  

// $action можт и не указывать на запись чего-либо в базу. Этот switch перебирает только записывающие действия $action
switch ($action):

	// добавляем новую тему (тут нет брейка, так и надо)
	case 'add_topic':

		$new_row['topic_name'] = $params['title'];
		$result['topic_prop']['new'] = 1;

	// вставляем новое сообщение (адаптировать для старта темы!)
	case 'add_post':

		$new_row['author_id'] = $user->id;
		$new_row['parent_id'] = $params['parent'] ? $params['parent'] : $_REQUEST['curTopic'];
		$new_row['topic_id'] = $_REQUEST['curTopic'];
		$new_row['message'] = $params['message'];
		$new_row['created'] = now('sql');

		$new_id = $db->query(
			'INSERT INTO ?_messages (?#) VALUES (?a)', array_keys($new_row), array_values($new_row)
		);

		$result['topic_prop']['scrollto'] = $new_id;

		break;


	// обновляет запись в ?_messages
	case 'update_message':

		$upd_id = $params['id'];
		unset($params['id']);
		$params['modified'] = now('sql'); // при любом обновлении пишем дату,
		$params['modifier'] = $user->id; // пользователя, отредактировавшего сообщение
		$params['locked'] = null; // и убираем блокировку

		$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $params, $upd_id);

		break;


	// удаляем сообщение
	case 'delete_message':

		// проверка блокировки сообщения
		$locked = $db->selectCell(
			'SELECT locked FROM ?_messages WHERE id = ?d', $params['id']
		);

		if ($locked) {

			$result['error'] = 'post_locked';

		} else {

			$upd_id = $params['id'];
			unset($params['id']);
			$params['deleted'] = 1;
			$params['modifier'] = $user->id;
			$params['modified'] = now('sql');

			$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $params, $upd_id);
		}

		break;

	// убираем тег с темы
	case 'tag_remove':

		$date = now('sql');

		$msgupd['modified'] = now('sql');
		$msgupd['modifier'] = $user->id;

		$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $msgupd, $params['msg']);

		$db->query('DELETE FROM ?_tagmap WHERE message = ?d AND tag = ?d', $params['msg'], $params['tag']);

		break;

endswitch;


////////////////////////
// Ищем любые обновления
////////////////////////

$result['new_maxdate'] = $db->selectCell(
	'SELECT GREATEST(MAX(created), IFNULL(MAX(modified), 0))
	FROM ?_messages WHERE IFNULL(modified, created) > ?' . ($condition ? (' AND ('.$condition.')') : '')
	, ($action == 'load_pages' || $action == 'next_page') ? 0 : $maxdateSQL
);


// если результатов 0 то отправляем старую макс. дату и прекращаем работу скрипта
if (!$result['new_maxdate']) {
	$result['new_maxdate'] = $result['old_maxdate'];
	$GLOBALS['_RESULT'] = $result;
	exit();
}
// иначе:


////////////////////////////////
// Получаем изменения списка тем
////////////////////////////////

// Импорт переменных
$sort = $_REQUEST['topicSort'] ? $_REQUEST['topicSort'] : 'updated';
$reverse = $_REQUEST['tsReverse'];

function extractTagArray ($string) {
	$chunks = explode('|', $string);
	$arr = array();
	if (count($chunks) && $chunks[0] != ''){
		foreach ($chunks as $val) {
			$arr[] = (int) $val;
		}
	}
	return $arr;
}

$tag_array = extractTagArray($filter_query);

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
		msg.modifier AS modifier_id,
		IFNULL(msg.modified, msg.created) AS maxdate,
		msg.deleted,
		usr.email AS author_email,
		IFNULL(usr.display_name, usr.login) AS author,
		mlast.id AS last_id,
		LEFT(mlast.message, ?d) AS lastpost,
		IFNULL(mlast.modified, mlast.created) AS lastdate,
		GREATEST(IFNULL(msg.modified, msg.created), IFNULL(IFNULL(mlast.modified, mlast.created),0)) as totalmaxd,
		IFNULL(lma.display_name, lma.login) AS lastauthor,
		lma.id AS lastauthor_id,
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
	{JOIN ?_tagmap tagmap
		ON tagmap.message = msg.id
		AND tagmap.tag IN (?a)}

	WHERE msg.topic_id = 0
		AND (IFNULL(msg.modified, msg.created) > ? OR IFNULL(mupd.modified, mupd.created) > ?)
		' . ($condition ? (' AND ('.$condition.')') : '') . '

	GROUP BY msg.id
	'

	, $cfg['cut_length'], $cfg['cut_length'] // ограничение выборки первого поста
	, $user->id
	, (count($tag_array) ? $tag_array : DBSIMPLE_SKIP)
	, $maxdateSQL, $maxdateSQL
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
	' . ($condition ? ' AND ' . $condition : '')
	, $maxdateSQL
);

foreach ($tags as $tag) {
	$id = $tag['message'];

	if ($result['topics'][$id]) $result['topics'][$id]['tags'][] = $tag;
}

// сортировка. До сортировки массив $result['topics'] имеет индекс в виде номера темы
switch ($sort):

	case 'updated':
		$result['topics'] = sort_by_field($result['topics'], 'totalmaxd', !$reverse);
		break;

endswitch;


//////////////////////////////////
// Получаем изменения текущей темы
//////////////////////////////////

// ОПТИМИЗИРОВАТЬ КОЛ-ВО ЗАПРОСОВ
if ($topic) {

	// проверяем, существует ли тема (не удалена ли) и читаем ее заголовок
	$topic_name = $db->selectCell(
		'SELECT msg.topic_name AS topic FROM ?_messages msg WHERE msg.id = ?d AND msg.deleted <=> NULL'
		, $topic
	);

	// если тема удалена (если удалена, name === null, если пустой заголовок - name === "")
	if ($topic_name === null) {

		$result['topic_prop']['deleted'] = true; // по этому флагу отслеживаем онлайн-удаление темы 

		// если тема не удалена
	} else {

		// Выясняем, сколько вообще сообщений в теме
		$result['topic_prop']['postcount'] = $postcount = $db->selectCell(
			'SELECT COUNT(id) FROM ?_messages WHERE (topic_id = ?d OR id = ?d) AND deleted <=> NULL',
			$topic, $topic
		);

		// забиваем в эту переменную значение по умолчанию
		$pglimit_dateSQL = jsts2sql($old_pglimdateTS || 0);

		// Если сразу не указано грузить все
		if (($action == 'load_pages' || $action == 'next_page') && $_REQUEST['plimit']) {

			// Узнаем, сколько же сказано грузить
			$plimit = $_REQUEST['plimit'] * $cfg['posts_per_page'];

			// если сообщений меньше, чем предел для загрузки - сообщаем, что это последняя страница
			if ($postcount <= $plimit) $show_all = 1;

			// Определение самого раннего сообщения, с которого нужно грузить страницу (исключительно)
			if (!$show_all) $pglimit_dateSQL = $db->selectCell('
				SELECT created AS message FROM ?_messages
				WHERE (topic_id = ?d OR id = ?d)
					AND deleted <=> NULL
				ORDER BY created DESC 
				LIMIT 1 OFFSET ?d',
				$topic, $topic, $plimit
			);

			// Если сообщение переданное по ссылке - за пределами текущих страниц
			if ($params['directMsg']) {
				$direct_dateSQL = $db->select('
					SELECT
						t.created,
						t.id,
						IF(t.created <= ?, t.created, ?) AS newdate
					FROM ?_messages AS t
					WHERE t.id <= ?d AND (t.topic_id = ?d OR t.id = ?d)
					ORDER BY t.id desc
					LIMIT 2
					', $pglimit_dateSQL
					, $pglimit_dateSQL
					, $params['directMsg']
					, $topic
					, $topic
				);

				$pglimit_dateSQL = $direct_dateSQL[1]['newdate'];
			}
		}

		if (!$_REQUEST['plimit'] || $show_all) {
			$result['topic_prop']['show_all'] = 1;
			$pglimit_dateSQL = jsts2sql('0');
		}

		$result['topic_prop']['pglimit_date'] = $pglimit_dateSQL;

		if ($action == 'load_pages') { // если загружаем новую тему

			$maxdateSQL = $pglimit_dateSQL;
			$result['topic_prop']['manual'] = true; // указываем что тема грузилась вручную (пока только для прокрутки) todo - не работает

			// выводим номер темы для подсветки ее в колонке тем
			$result['topic_prop']['id'] = $topic;

			// хотим узнать, когда пользователь отмечал эту тему прочитанной
			if ($user->id != 0) {
				$date_read = $db->selectCell(
					'SELECT timestamp FROM ?_unread WHERE user = ?d AND topic = ?d'
					, $user->id, $topic
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
						, array_keys($values), array_values($values));

					$date_read = 'firstRead'; // клиентская часть должна знать!
				}

				$result['topic_prop']['date_read'] = $date_read; // вывести в клиент
			}

		}

		// Что делаем, если сказано загрузить только следующую страницу
		/*
		if ($action == 'next_page') {
			
			if (!$plimit) {
				//$params['old_limit'];
			} else {
				
			}
		}
		*/

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
				msg.modifier,
				usr.email AS author_email,
				IFNULL(usr.display_name, usr.login) AS author,
				IF(unr.timestamp < IFNULL(msg.modified, msg.created) && IFNULL(msg.modifier, msg.author_id) != ?d, 1, 0) AS unread,
				moder.login AS modifier_name,
				(SELECT starter.author_id FROM ?_messages starter WHERE starter.id = msg.topic_id ) AS topicstarter,
				uset.param_value as author_avatar
			FROM ?_messages msg

			LEFT JOIN ?_users usr 
				ON msg.author_id = usr.id
			LEFT JOIN ?_unread unr
				ON unr.topic = IF(msg.topic_id = 0, msg.id, msg.topic_id) AND unr.user = ?d
			LEFT JOIN ?_users moder
				ON msg.modifier = moder.id
			LEFT JOIN ?_user_settings uset
				ON msg.author_id = uset.user_id AND uset.param_key = "avatar"

			WHERE
				(msg.topic_id = ?d OR msg.id = ?d) AND 
				((IFNULL(msg.modified, msg.created) > ? AND msg.created > ?)'
				. ($action == 'next_page' ? ' OR (msg.created <= ? AND msg.created > ?)' : '') . ')
			ORDER BY msg.created ASC'

			, $user->id, $user->id
			, $topic, $topic
			, $maxdateSQL
			, $pglimit_dateSQL
			, jsts2sql($old_pglimdateTS)
			, $pglimit_dateSQL
		));

		$result['topic_prop']['name'] = $topic_name; // вывод в клиент имени
	}
}

$GLOBALS['_RESULT'] = $result;

print_r(json_decode($test, true));
echo "\n";
print_r($tag_array);
?>
