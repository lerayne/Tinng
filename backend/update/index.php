<?php
//sleep(1); // в целях отладки

require_once '../includes/backend_initial2.php';

$result['xhr'] = $xhr_id;
//$result['sessid'] = $sessid;

/* // Запись в лог
$log = fopen('ajax_log.txt', 'w+');
function ex ($log){
	fwrite($log, 'process terminated '.connection_status()."\n");
}
register_shutdown_function("ex", $log);
*/

$GLOBALS['debug'] = Array();

////////////////////////////////
// Функции для этой части движка
////////////////////////////////

// подготовка каждой строки
function ready_row($row) {

	// убираем из сообщений об удаленных рядах всю лишнюю инфу
	if ($row['deleted']) {

		$cutrow['deleted'] = 1;
		$cutrow['id'] = $row['id'];
		$cutrow['author'] = $row['author'];
		$cutrow['created'] = $row['created'];
		unset($row);
		$row = $cutrow;

	} else { // Если работаем не с отчетом об удалении 

		if ($row['author_avatar'] == 'gravatar') {
			$row['author_avatar'] = 'http://www.gravatar.com/avatar/' . md5(strtolower($row['author_email'])) . '?s=48';
		}

		unset($row['author_email']); // не выводим мыло в аякс-переписке
	}

	return $row;
}


// создание дерева (внимание !! целесообразность ветвления - под вопросом)
// сейчас используется для подготовки всех опций
function make_tree($raw) {
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
function sort_by_field($array, $field, $reverse) {

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

function extract_tag_array($string) {
	$chunks = explode('|', $string);
	$arr = array();
	if (count($chunks) && $chunks[0] != '') {
		foreach ($chunks as $val) {
			$arr[] = (int) $val;
		}
	}
	return $arr;
}

// класс чтения обновлений сервера
class Feed {

	function __construct($maxdate) {

		$this->maxdate = $maxdate;
		$this->sql_maxdate = jsts2sql($this->maxdate);
		$this->new_sql_maxdate = $this->sql_maxdate;
	}


	///////////////////////
	// есть ли вообще новые
	///////////////////////

	// todo - возможно - убрать совсем, так как сейчас она фактически ни с чем не сравнивается
	function any_new() {
		global $db;

		// с этой переменной ничего не сравнивается. Ее наличие говорит о необходимости выгрести какие-то новые данные,
		// а потом она просто передается в клиент для установки там новой отсчетной даты.
		$new_sql_maxdate = $db->selectCell('
			SELECT GREATEST(MAX(created), IFNULL(MAX(modified), 0))
			FROM ?_messages WHERE IFNULL(modified, created) > ?
			'

			, /*($action == 'load_pages' || $action == 'next_page') ? 0 :*/ $this->sql_maxdate
		);

		if ($new_sql_maxdate) {
			return true;
		} else return false;
	}



	///////
	// темы
	///////

	function get_topics($params, &$meta = Array()) {
		global $cfg, $db, $user;

		if (!$meta['updates_since']) $meta['updates_since'] = jsts2sql(0);

		$tag_array = extract_tag_array($params['filter']);

		// проверяем простым запросом, есть ли что на вывод вообще, прежде чем отправлять следующего "монстра"))
		// todo - удалось избавиться от подзапроса для вычисления даты последнего поста темы. Может удастся и в монстре?
		$any_new = $db->selectCell('
			SELECT GREATEST(MAX(msg.created), IFNULL(MAX(msg.modified), 0), MAX(mupd.created), IFNULL(MAX(mupd.modified), 0))
			FROM ?_messages msg
			LEFT JOIN ?_messages mupd ON mupd.topic_id = msg.id
			{JOIN ?_tagmap map ON map.message = msg.id AND map.tag IN(?a)}
			WHERE GREATEST(IFNULL(msg.modified, msg.created), IFNULL(mupd.modified, mupd.created)) > ? AND msg.topic_id = 0
			'
			, (count($tag_array) ? $tag_array : DBSIMPLE_SKIP)
			, $meta['updates_since']
		);

		$GLOBALS['debug']['since'] = $meta['updates_since'];
		$GLOBALS['debug']['tags'] = $tag_array;

		// если нет - возвращаем пустой массив и прерываем функцию
		if (!$any_new) return Array();

		// todo - рано или поздно с этим монстром надо что-то делать. Оптимизация архитектуры бд...
		// в данный момент база оптимизирована на скорость записи. Но вообще чтение происходит чаще. Немного спасают
		// проверочные предварительные запросы, но значит ли это, что стоит оставлять этого монстра с кучей подзапросов?
		$query = "
			SELECT
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
				AND ISNULL(msg.deleted)

			GROUP BY msg.id
		";

		$topics = make_tree( $db->select( $query

			, $cfg['cut_length'], $cfg['cut_length'] // ограничение выборки первого поста
			, $user->id
			, (count($tag_array) ? $tag_array : DBSIMPLE_SKIP)
			, $meta['updates_since']
			, $meta['updates_since']
		));

		$GLOBALS['debug']['posts'] = count($topics);



		// выборка тегов
		// todo - выбираются все теги по неудаленным темам, подходящим под выборку по дате. Нужно чтобы работала выборка и по
		// самим тегам, но я с этим 2 часа возился - так и не понял. опциональный блок в этом запросе работает только если в массиве один тег
		$query = "
			SELECT
				msg.id AS message,
				tag.id,
				tag.name,
				tag.type
			FROM ?_tagmap map
			JOIN ?_messages msg ON map.message = msg.id
			JOIN ?_tags tag ON tag.id = map.tag
			{
				JOIN ?_tagmap map2
					ON map2.message = msg.id
					AND map2.tag IN (?a)
        	}

			WHERE ISNULL(msg.deleted) AND IFNULL(msg.modified, msg.created) > ?
			ORDER BY msg.id, tag.id
		";

		$tags = $db->select( $query

			, (/*count($tag_array) ? $tag_array : */DBSIMPLE_SKIP)
			, $meta['updates_since']
		);

		$GLOBALS['debug']['tags'] = $tags;

		foreach ($tags as $tag) {
			$id = $tag['message'];

			if ($topics[$id]) $topics[$id]['tags'][] = $tag;
		}



		// сортировка. До сортировки массив $topics имеет индекс в виде номера темы
		switch ($params['sort']){

			case 'updated':
				$topics = sort_by_field($topics, 'totalmaxd', $params['sort_reverse']);
				break;
		}

		$meta['updates_since'] = $any_new;

		// возвращаем полученный массив тем
		return $topics;
	}



	////////
	// posts
	////////

	function get_posts($posts, &$meta = Array()) {
		global $cfg, $db, $user;


		// забиваем в эту переменную значение по умолчанию
		$pglimit_dateSQL = jsts2sql($old_pglimdateTS || 0);

		// Если сразу не указано грузить все
		if ( /*($action == 'load_pages' || $action == 'next_page') &&*/
			$posts['quantity']
		) {

			$postcount = $db->selectCell(
				'SELECT COUNT(id) FROM ?_messages WHERE (topic_id = ?d OR id = ?d) AND deleted <=> NULL',
				$posts['topic'], $posts['topic']
			);

			// если сообщений меньше, чем предел для загрузки - сообщаем, что это последняя страница
			if ($postcount <= $posts['quantity']) $show_all = 1;

			// Определение самого раннего сообщения, с которого нужно грузить страницу (исключительно)
			if (!$show_all) $pglimit_dateSQL = $db->selectCell('
				SELECT created AS message FROM ?_messages
				WHERE (topic_id = ?d OR id = ?d)
					AND deleted <=> NULL
				ORDER BY created DESC
				LIMIT 1 OFFSET ?d',
				$posts['topic'], $posts['topic'], $posts['quantity']
			);

			// Если сообщение переданное по ссылке - за пределами текущих страниц
			if ($posts['directMsg']) {
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
					, $posts['directMsg']
					, $posts['topic']
					, $posts['topic']
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
			$result['topic_prop']['id'] = $posts['topic'];

			// хотим узнать, когда пользователь отмечал эту тему прочитанной
			if ($user->id != 0) {
				$date_read = $db->selectCell(
					'SELECT timestamp FROM ?_unread WHERE user = ?d AND topic = ?d'
					, $user->id, $posts['topic']
				);

				// ой, ни разу! Установить ее прочитанной в этот момент!
				if (!$date_read) {

					$date_read = now('sql');
					$values = Array(
						'user' => $user->id,
						'topic' => $posts['topic'],
						'timestamp' => $date_read
					);
					$db->query('INSERT INTO ?_unread (?#) VALUES (?a)'
						, array_keys($values), array_values($values));

					$date_read = 'firstRead'; // клиентская часть должна знать!
				}

				$result['topic_prop']['date_read'] = $date_read; // вывести в клиент
			}
		}

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
			, $posts['topic'], $posts['topic']
			, $maxdateSQL
			, $pglimit_dateSQL
			, jsts2sql($old_pglimdateTS)
			, $pglimit_dateSQL
		));

		$result['topic_prop']['name'] = $topic_name; // вывод в клиент имени

		return array();
	}

	///////////////
	// single topic
	///////////////

	function get_topic($topic, &$meta = Array()) {
		global $db;

		// проверяем, существует ли тема и читаем ее заголовок.
		$topic = $db->selectRow('
			SELECT
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
				(SELECT COUNT(id) FROM ?_messages msgq WHERE (msgq.topic_id = ?d OR msgq.id = ?d) AND deleted <=> NULL) AS post_count

			FROM ?_messages msg

			WHERE msg.id = ?d AND msg.topic_id = 0
			'
			, $topic['id'], $topic['id'], $topic['id']
		);

		return $topic;
	}
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////
// разбираем что пришло
///////////////////////

function parse_request($request) {
	global $user, $db;

	$result = array();

	$feed = new Feed($request['later_than']);



	///////////////////////////////
	// Записываем в базу обновления
	///////////////////////////////

	if ($request['write']) {

		$writes = $request['write'];

		foreach ($writes as $write) {
			switch ($write['action']) {

				// добавляем новую тему (тут нет брейка, так и надо)
				case 'add_topic':

					$new_row['topic_name'] = $write['title'];
					$result['topic_prop']['new'] = 1;

				// вставляем новое сообщение (адаптировать для старта темы!)
				case 'add_post':

					$new_row['author_id'] = $user->id;
					$new_row['parent_id'] = $write['parent'] ? $write['parent'] : $_REQUEST['curTopic'];
					$new_row['topic_id'] = $_REQUEST['curTopic'];
					$new_row['message'] = $write['message'];
					$new_row['created'] = now('sql');

					$new_id = $db->query(
						'INSERT INTO ?_messages (?#) VALUES (?a)', array_keys($new_row), array_values($new_row)
					);

					$result['topic_prop']['scrollto'] = $new_id;

					break;


				// обновляет запись в ?_messages
				case 'update_message':

					$upd_id = $write['id'];
					unset($write['id']);
					$params['modified'] = now('sql'); // при любом обновлении пишем дату,
					$params['modifier'] = $user->id; // пользователя, отредактировавшего сообщение
					$params['locked'] = null; // и убираем блокировку

					$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $write, $upd_id);

					break;


				// удаляем сообщение
				case 'delete_message':

					// проверка блокировки сообщения
					$locked = $db->selectCell(
						'SELECT locked FROM ?_messages WHERE id = ?d', $write['id']
					);

					if ($locked) {

						$result['error'] = 'post_locked';

					} else {

						$upd_id = $write['id'];
						unset($write['id']);
						$write['deleted'] = 1;
						$write['modifier'] = $user->id;
						$write['modified'] = now('sql');

						$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $write, $upd_id);
					}

					break;

				// убираем тег с темы
				case 'tag_remove':

					$date = now('sql');

					$msgupd['modified'] = now('sql');
					$msgupd['modifier'] = $user->id;

					$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $msgupd, $write['msg']);

					$db->query('DELETE FROM ?_tagmap WHERE message = ?d AND tag = ?d', $write['msg'], $write['tag']);

					break;
			}
		}
	}


	/////////////////////////////
	// выдаем данные по подпискам
	/////////////////////////////

	if ($request['subscribe']) {

		$subscribers = $request['subscribe'];

		if ($request['meta']) $meta = $request['meta'];

		// есть ли подписчики и хоть что-то обновленное на сервере?
		if (count($subscribers) && $feed->any_new()) {

			foreach ($subscribers as $subscriberId => $subscriptions) {

				foreach ($subscriptions as $feedName => $params) {
					// вызываем метод get_[имя фида]
					$method_name = 'get_' . $params['feed'];
					// тут в конце страшная магия - передача параметра в функцию по ссылке
					$result['feeds'][$subscriberId][$feedName] = $feed->$method_name($params, $meta[$subscriberId][$feedName]);
				}
			}
		}

		// и вот тут мы записываем мету
		$result['meta'] = $meta;
	}

	return $result;
}

$GLOBALS['_RESULT'] = parse_request($_REQUEST);


$old_pglimdateTS = $_REQUEST['pglimdateTS'];


//print_r($GLOBALS['debug']);
/*print_r(json_decode($test, true));
echo "\n";
print_r($tag_array);*/
?>
