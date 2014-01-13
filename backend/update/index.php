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
			$arr[] = (int)$val;
		}
	}
	return $arr;
}

function tags_to_ids($string) {
	global $db;

	$tags = explode('|', $string);
	$arr = array();

	if (count($tags) && $tags[0] != '') {
		$arr = $db->selectCol('SELECT id FROM ?_tags WHERE name IN (?a)', $tags);
	}

	return $arr;
}

function strip_nulls($array) {

	foreach ($array as $key => $val) {

		// сначала рекурсивно вычищаем нуллы
		if (is_array($val)) $array[$key] = strip_nulls($val);
		// а потом проверяем не $val, а $array[$key] и таким образом рекурсивно избавляемся от пустых массивов
		if ($array[$key] == null || count($array[$key]) == 0) unset($array[$key]);
	}

	return $array;
}

function load_defaults($params, $defaults) {
	foreach ($defaults as $key => $def_val) {
		if (!$params[$key]) $params[$key] = $def_val;
	}

	return $params;
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

			, /*($action == 'load_pages' || $action == 'next_page') ? 0 :*/
			$this->sql_maxdate);

		if ($new_sql_maxdate) {
			return true;
		} else return false;
	}


	///////
	// темы
	///////

	function get_topics($topics, &$meta = Array()) {
		global $cfg, $db, $user;

		// defaults
		$topics = load_defaults($topics, $topics_defaults = Array(
			'sort' => 'updated',
			'sort_reversed' => true,
			'filter' => ''
		));

		$meta = load_defaults($meta, $meta_defaults = Array(
			'updates_since' => '0' // работает как false, а в SQL-запросах по дате - как 0
		));

		// режим обновления?
		$update_mode = !!$meta['updates_since'];

		// есть фильтрация по тегам?
		$tag_array = tags_to_ids($topics['filter']);

		// составляем джойны для пересечений по тегам
		// поскольку id тегов приходят не от клиента, а вычисляются здесь из имен тегов, использование прямых sql-иньекций относительно безопасно
		$tags_joins = '';
		foreach ($tag_array as $i => $tag_id) {
			$tags_joins .= "/*sql*/ JOIN ?_tagmap tagmap{$i} ON tagmap{$i}.message = msg.id AND tagmap{$i}.tag = {$tag_id} \n";
		}

		// проверяем простым запросом, есть ли что на вывод вообще, прежде чем отправлять следующего "монстра"))
		// todo - удалось избавиться от подзапроса для вычисления даты последнего поста темы. Может удастся и в монстре?
		$updates_since = $db->selectCell("
			SELECT GREATEST(MAX(msg.created), IFNULL(MAX(msg.modified), 0), IFNULL(MAX(mupd.created), 0), IFNULL(MAX(mupd.modified), 0))
			FROM ?_messages msg
			LEFT JOIN ?_messages mupd ON mupd.topic_id = msg.id

			{$tags_joins}
			/*{JOIN ?_tagmap map ON map.message = msg.id AND map.tag IN(?a)}*/

			WHERE msg.topic_id = 0
			{AND (IFNULL(msg.modified, msg.created) > ? OR IFNULL(mupd.modified, mupd.created) > ?)}
			"
			//, $tag_array // при пустом массиве скип автоматический
			, ($meta['updates_since'] ? $meta['updates_since'] : DBSIMPLE_SKIP)
			, ($meta['updates_since'] ? $meta['updates_since'] : DBSIMPLE_SKIP)
		);

		// если нет - возвращаем пустой массив и прерываем функцию
		if (!$updates_since) return Array();


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
				(SELECT COUNT(mcount.id) FROM ?_messages mcount WHERE IF(mcount.topic_id = 0, mcount.id, mcount.topic_id) = msg.id AND mcount.deleted IS NULL) AS postsquant,
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

			{$tags_joins}

			/*{JOIN ?_tagmap tagmap
				ON tagmap.message = msg.id
				AND tagmap.tag IN (?a)}*/

			WHERE msg.topic_id = 0
				/* пробовал через GREATEST - сокращает вывод до одной строки */
				{AND (IFNULL(msg.modified, msg.created) > ?}{ OR IFNULL(mupd.modified, mupd.created) > ?)}
				{AND msg.deleted IS NULL AND 1 = ?d}

			GROUP BY msg.id
		";

		$output_topics = make_tree($db->select($query

			, $cfg['cut_length'], $cfg['cut_length'] // ограничение выборки первого поста
			, $user->id
			//, $tag_array // при пустом массиве скип автоматический
			, ($meta['updates_since'] ? $meta['updates_since'] : DBSIMPLE_SKIP) // зачем ставить условия, если выбираем всё?
			, ($meta['updates_since'] ? $meta['updates_since'] : DBSIMPLE_SKIP)
			, (!$update_mode ? 1 : DBSIMPLE_SKIP) // достаем удаленные только если мы в режиме обновления, а не начальной загрузки
		));


		// выборка тегов
		$query = "
			SELECT
				msg.id AS message,
				tag.id,
				tag.name,
				tag.type
			FROM ?_tagmap map
			JOIN ?_messages msg ON map.message = msg.id
			JOIN ?_tags tag ON tag.id = map.tag

			{JOIN ?_tagmap map2
				ON map2.message = msg.id
				AND map2.tag IN (?a)}

			WHERE ISNULL(msg.deleted) {AND IFNULL(msg.modified, msg.created) > ?}
			GROUP BY map.link_id
			ORDER BY tag.id
		";

		$tags = $db->select($query

			, $tag_array
			, ($meta['updates_since'] ? $meta['updates_since'] : DBSIMPLE_SKIP)
		);

		foreach ($tags as $tag) {
			$id = $tag['message'];

			if ($output_topics[$id]) $output_topics[$id]['tags'][] = $tag;
		}


		// сортировка. До сортировки массив $topics имеет индекс в виде номера темы
		switch ($topics['sort']) {

			case 'updated':
				$output_topics = sort_by_field($output_topics, 'totalmaxd', $topics['sort_reverse']);
				break;
		}

		// все запросы в базу идут со старой датой и только потом мы обновляем ее
		$meta['updates_since'] = $updates_since;

		// возвращаем полученный массив тем
		return $output_topics;
	}


	////////
	// posts
	////////

	function get_posts($posts, &$meta = Array()) {
		global $cfg, $db, $user;

		// defaults
		$posts = load_defaults($posts, $posts_defaults = Array(
			'limit' => 0, // Ограничение выборки последними n сообщениями. 0 - грузить все
			'show_post' => 0 // При указани на конкретный пост происходит проверка не вне лимита ли он и если да - лимит сдвигается до него
		));

		$meta = load_defaults($meta, $meta_defaults = Array(
			'updates_since' => '0', // работает как false, а в SQL-запросах по дате - как 0
			'slice_start' => '0' // работает как false, а в SQL-запросах по дате - как 0
		));

		$topic_exists = $db->selectCell('
			SELECT id
			FROM ?_messages
			WHERE id = ?d AND deleted IS NULL
			'
			, $posts['topic']
		);

		// если заглавного сообщения не существует, или оно было удалено
		if (!$topic_exists) return Array();


		// если загружаем тему с нуля и есть авторизованный юзер
		if (!$meta['updates_since'] && $user->id != 0) {

			// проверяем, когда пользователь отмечал тему прочитанной
			$date_read = $db->selectCell(
				'SELECT timestamp FROM ?_unread WHERE user = ?d AND topic = ?d'
				, $user->id
				, $posts['topic']
			);

			// ой, ни разу! Установить ее прочитанной в этот момент!
			if (!$date_read) {

				// пробуем сходу отмечать прочитанным только первое сообщение
				$first_post_date = $db->selectCell('SELECT IFNULL(modified, created) AS updated FROM ?_messages WHERE id = ?d ', $posts['topic']);

				$values = Array('user' => $user->id, 'topic' => $posts['topic'], 'timestamp' => $first_post_date);
				$db->query('INSERT INTO ?_unread (?#) VALUES (?a)', array_keys($values), array_values($values));

				$posts['show_post'] = $posts['topic']; // установить указатель на первое сообщение
				$posts['limit'] = 0; // загрузить все сообщения

			// уже читали
			} else {

				// определить первое непрочитанное сообщение (не учитывать мои и отредактированные мной)
				$first_unread = $db->selectCell('
					SELECT id FROM ?_messages
					WHERE IFNULL(modified, created) > ? AND topic_id = ?d AND deleted IS NULL
						AND IF(modified IS NULL, author_id, modifier) != ?d
					ORDER BY created ASC
					LIMIT 1
					'
					, $date_read
					, $posts['topic']
					, $user->id
				);

				// если такие есть - установить его как то, до которого нужно прокрутить
				if ($first_unread) {
					$posts['show_post'] = $first_unread;
				}
			}
		}


		// секция установки слайсов ////////////////////////////////////////////////////////////////////////////////////

		/*
		todo - ВНИМАНИЕ! Текущая система слайсов базируется на 2 параметрах - лимите и хранимой в мета-секции дате начала
		слайса. Для расширения слайса на клиенте подсчитывается кол-во загруженных в данный момент постов, к ним прибавляется
		число N и производится мягкая (без сброса меты) переподписка. Этот принцип сильно полагается на то, что в теме не
		появится N и более новых сообщений с момента отправки запроса на подгрузку. Для шорт-полла это особенно критично,
		т.к. новые сообщения приходят с фиксированной задержкой. Грубо говоря - если в теме за 5 секунд задержки появится более
		N новых сообщений - может произойти непредвиденный сбой - система посчитает что подгрузка не произошла. Внешне это может
		выглядеть как не срабатывание кнопки "подгрузить еще". Впрочем, должно быть достаточно просто нажать ее еще раз.
		*/

		// используем для того, чтобы отсечь ненужные условия в запросе
		if ($posts['limit']) {

			// всего постов в теме
			$postcount = $db->selectCell('
				SELECT COUNT(id)
				FROM ?_messages
				WHERE IF(topic_id = 0, id, topic_id) = ?d
				AND deleted IS NULL
				'
				, $posts['topic']
			);

			// если кол-во сообщений в теме меньше, чем ограничение - сбросить ограничение
			if ($postcount <= $posts['limit']) $posts['limit'] = 0;
		}


		// если нет ограничения по постам
		if (!$posts['limit']) {

			// устанавливаем дату "от" на 0
			$slice_start = '0';

			// если это догрузка - устанавливаем дату "до"
			if ($meta['slice_start']) $slice_end = $meta['slice_start'];

		} else {
		//если есть ограничение

			// мета есть, в выборке по лимиту есть более ранние сообщения, чем мета - возвращаем новую дату
			// меты нет - возвращаем новую дату по лимиту
			// мета есть и она раньше, чем новая выборка по лимиту - возвращаем мету

			$prev_sstart = $meta['slice_start'] ? $meta['slice_start'] : DBSIMPLE_SKIP;

			$slice_start = $db->selectCell('
				SELECT
					{IF(created < ?, created, }{ ?) AS} created
				FROM ?_messages
				WHERE IF(topic_id=0, id, topic_id) = ?d AND deleted IS NULL
				ORDER BY created DESC
				LIMIT 1 OFFSET ?d
				'
				, $prev_sstart, $prev_sstart
				, $posts['topic']
				, ((int) $posts['limit'])-1
			);

			unset($prev_sstart);

			// если передан номер конкретного поста - проверяем, не выходит ли он за слайс-"от" и если да - возвращаем новый слайс-"от"
			// это только для передачи номера поста по параметру из адрессной строки, поэтому в догрузке не используется
			if ($posts['show_post']) {
				$post_start = $db->selectCell('
					SELECT IF(created < ?, created, ?)
					FROM ?_messages
					WHERE id = ?d AND deleted IS NULL
					'
					, $slice_start, $slice_start
					, $posts['show_post']
				);

				if ($post_start) $slice_start = $post_start;
			}

			// если в мете слайс-от уже был и он не равен новому - устанавливаем слайс-до в значение из меты
			if ($meta['slice_start'] && $slice_start != $meta['slice_start']) $slice_end = $meta['slice_start'];
		}

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// смотрим, есть ли сообщение с датой позже чем $meta['updates_since'] и $slice_start
		// issue - если первая выборка даты не выдает удаленных, возможна ситуация когда последний удаленный пост приходит
		// с ближайшим апдейтом. todo - проверить все ли ок.
		$new_updates_since = $db->selectCell( '
			SELECT GREATEST(MAX(msg.created), IFNULL(MAX(msg.modified), 0))
			FROM ?_messages msg
			WHERE IF(msg.topic_id = 0, msg.id, msg.topic_id) = ?d /* topic_id */
				/*{AND msg.deleted IS NULL AND 1 = ?d}*/
				{AND msg.created >= ?} /* $slice_start */
				{AND IFNULL(msg.modified, msg.created) > ?} /* $meta["updates_since"] */
			'
			, $posts['topic']
			//, (!$meta['updates_since'] ? 1 : DBSIMPLE_SKIP)
			, ($slice_start ? $slice_start : DBSIMPLE_SKIP)
			, ($meta['updates_since'] ? $meta['updates_since'] : DBSIMPLE_SKIP)
		);


		// если мы не в режиме догрузки и нет новых/обновленных - возвращаем пустой массив.
		// todo - возможно нужно что-то сделать со $slice_satrt
		if (!$slice_end && !$new_updates_since) return Array();

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// наконец, запрашиваем посты!
		$query = '
			SELECT
				msg.id AS ARRAY_KEY,
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
				IF(msg.topic_id = 0, msg.id, msg.topic_id) = ?d
				{AND msg.deleted IS NULL AND 1 = ?d}
		';

		$query_end = '/*sql*/ ORDER BY msg.created ASC ';

		// если режим догрузки
		if ($slice_end) {

			$query .= '/*sql*/
				AND msg.created >= ?
				AND ((msg.created < ? AND msg.deleted IS NULL) OR IFNULL(msg.modified, msg.created) > ?)
			';

			$output_posts = make_tree($db->select($query . $query_end
				, $user->id
				, $user->id
				, $posts['topic']
				, (!$meta['updates_since'] ? 1 : DBSIMPLE_SKIP)

				, $slice_start
				, $slice_end
				, $meta['updates_since']
			));

		} else {

			$query .= '/*sql*/
				{AND msg.created >= ?} /* $slice_start */
				{AND IFNULL(msg.modified, msg.created) > ?} /* $meta["updates_since"] */
			';

			$output_posts = make_tree($db->select($query . $query_end
				, $user->id
				, $user->id
				, $posts['topic']
				, (!$meta['updates_since'] ? 1 : DBSIMPLE_SKIP)

				, ($slice_start ? $slice_start : DBSIMPLE_SKIP)
				, ($meta['updates_since'] ? $meta['updates_since'] : DBSIMPLE_SKIP)
			));
		}
		// да, можно было не ставить условие и объединить два варианта подачи запроса в один, но в таком случае либо
		// условия по плейсхолдерам слишком сложные, либо БД всегда сравнивает даты, даже если они равны 0

		// вставляем в сам пост указание. Сейчас не используется для ссылки и выделения, используется только для
		// прокрутки до первого поста, если тема читается впервые
		if ($posts['show_post'] && $output_posts[$posts['show_post']]) {
			$output_posts[$posts['show_post']]['refered'] = 1;
		}

		// показываем теги заглавного сообщения
		if ($output_posts[$posts['topic']]) {

			$tags = $db->select('
				SELECT
					tag.id,
					tag.name,
					tag.type
				FROM ?_tagmap map
				LEFT JOIN ?_tags tag ON map.tag = tag.id
				WHERE map.message = ?d
				'
				, $posts['topic']
			);

			$output_posts[$posts['topic']]['tags'] = $tags;
		}


		$meta['slice_start'] = $slice_start;
		if ($new_updates_since) $meta['updates_since'] = $new_updates_since;

		return $output_posts;

	}

	///////////////
	// single topic
	///////////////

	function get_topic($topic, &$meta = Array()) {
		global $db;

		// defaults
		$topic = load_defaults($topic, $topic_defaults = Array(
			'id' => 0, // Ограничение выборки последними n сообщениями. 0 - грузить все
		));

		$meta = load_defaults($meta, $meta_defaults = Array(
			'updated_at' => '0', // определяем
		));

		// изменялось ли заглавное сообщение темы?
		$new_updated_at = $db->selectCell('
			SELECT IFNULL(msg.modified, msg.created) AS updated
			FROM ?_messages msg
			WHERE msg.id = ?d AND msg.topic_id = 0
			{AND IFNULL(msg.modified, msg.created) > ?}
			'
			, $topic['id']
			, ($meta['updated_at'] ? $meta['updated_at'] : DBSIMPLE_SKIP)
		);

		if ($new_updated_at) {

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
				(SELECT COUNT(id) FROM ?_messages msgq WHERE IF(msgq.topic_id = 0, msgq.id, msgq.topic_id) = ?d AND deleted IS NULL) AS post_count

			FROM ?_messages msg

			WHERE msg.id = ?d AND msg.topic_id = 0
			'
				, $topic['id']
				, $topic['id']
			);

			$meta['updated_at'] = $new_updated_at;

		} else {

			$topic = Array();
		}

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

		foreach ($writes as $write_index => $write) {
			switch ($write['action']) {

				// добавляем новую тему (тут нет брейка, так и надо)
				case 'add_topic':

					$new_row['topic_name'] = $write['title'];

				// вставляем новое сообщение (адаптировать для старта темы!)
				case 'add_post':

					$write['topic'] = $write['topic'] ? $write['topic'] : 0;

					$new_row['author_id'] = $user->id;
					$new_row['parent_id'] = $write['parent'] ? $write['parent'] : $write['topic'];
					$new_row['topic_id'] = $write['topic'];
					$new_row['message'] = $write['message'];
					$new_row['created'] = now('sql');

					$new_node_id = $db->query('INSERT INTO ?_messages (?#) VALUES (?a)', array_keys($new_row), array_values($new_row));

					if ($write['action'] == 'add_topic') {
						$result['actions'][$write_index] = Array('action' => $write['action'],'id' => $new_node_id);

						if (count($write['tags'])) {
							foreach ($write['tags'] as $tag) {
								$tag_id = $db->selectCell('SELECT id FROM ?_tags WHERE name = ?', $tag);

								if (!$tag_id) {

									$new_tag = array(
										'name' => $tag,
										'type' => 'user'
									);

									$tag_id = $db->query('INSERT INTO ?_tags (?#) VALUES (?a)', array_keys($new_tag), array_values($new_tag));
								}

								$new_tagbind = array(
									'message' => $new_node_id,
									'tag' => $tag_id
								);

								$db->query('INSERT INTO ?_tagmap (?#) VALUES (?a)', array_keys($new_tagbind), array_values($new_tagbind));
							}
						}
					}

					break;


				// обновляет запись в ?_messages
				case 'update_message':
					unset ($write['action']);

					$upd_id = $write['id'];
					unset($write['id']);
					$write['modified'] = now('sql'); // при любом обновлении пишем дату,
					$write['modifier'] = $user->id; // пользователя, отредактировавшего сообщение
					$write['locked'] = null; // и убираем блокировку

					$db->query('UPDATE ?_messages SET ?a WHERE id = ?d', $write, $upd_id);

					break;


				// удаляем сообщение
				case 'delete_message':
					unset ($write['action']);

					// проверка блокировки сообщения
					$locked = $db->selectCell('SELECT locked FROM ?_messages WHERE id = ?d', $write['id']);

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
		if (count($subscribers)) {

			foreach ($subscribers as $subscriberId => $subscriptions) {

				foreach ($subscriptions as $feedName => $params) {

					// вызываем метод get_[имя фида]
					$method_name = 'get_' . $params['feed'];

					// тут в конце страшная магия - передача параметра в функцию по ссылке
					$feed_data =  $feed->$method_name($params, $meta[$subscriberId][$feedName]);
					if (count($feed_data)) $result['feeds'][$subscriberId][$feedName] = $feed_data;
				}
			}
		}

		// и вот тут мы записываем мету (параллельно очищая ее от нуллов и пустых массивов)
		$result['meta'] = strip_nulls($meta);
	}

	return $result;
}

$GLOBALS['_RESULT'] = parse_request($_REQUEST);


//print_r($GLOBALS['debug']);
?>
