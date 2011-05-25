<?	

	
	// СТАРЫЕ ФУНКЦИИ БЕКЕНДА
	
	// запрашиваем сообщения
	case 'load_posts':
		
		// дата последнего изменения в постах данной темы
		$result['maxdate'] = $db->selectCell(
			'SELECT GREATEST(MAX(msg_created), IFNULL(MAX(msg_modified),0)) FROM ?_messages
			WHERE msg_id = ? OR msg_topic_id = ?' , $id , $id
		);
		
		// убедться что тема не удалена и вычитать ее тему
		$raw = $db->selectRow(
			'SELECT msg_topic, msg_id FROM ?_messages WHERE msg_id = ?d AND msg_deleted <=> NULL'
			, $id
		);
		$result['topic'] = $raw['msg_topic'];
		$published = $raw['msg_id'];
		
		// проверить, была ли тема прочитана ранее
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
	
	
	// ожидание обновлений постов в текущей теме
	case 'wait_post':

		$topic = $_REQUEST['topic'];

		// форматируем, отнимаем три лишних нолика микросекунд, прилетевшие из js
		$maxdate = jsts2sql($_REQUEST['maxdate']);

		// Выбираем количество измененных строк
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


	
	case 'load_topics':

		$sort = $_REQUEST['sort'] ? $_REQUEST['sort'] : 'updated';
		$reverse = $_REQUEST['sortRev'];

		// главная выборка
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

		// обработка выборки
		if ($result['data']) foreach ($result['data'] as $key => $val):

			// количество сообщений в каждой теме
			$result['data'][$key]['postsquant'] = 1 + $db->selectCell(
				'SELECT COUNT( * ) FROM ?_messages
				WHERE msg_deleted <=> NULL AND msg_topic_id = ?d'
				, $val['id']
			);

			// найти последнее изменение в теме
			$raw = $db->selectRow(
				'SELECT 
					UNIX_TIMESTAMP(GREATEST(MAX(msg_created), IFNULL(MAX(msg_modified),0))) AS updated,
					UNIX_TIMESTAMP(MAX(msg_created)) AS lastpost
				FROM ?_messages WHERE (msg_topic_id = ?d OR msg_id = ?d) AND msg_deleted <=> NULL'
				, $val['id'], $val['id']
			);

			$maxd[] = $raw['updated'];

			$result['data'][$key]['updated'] = date('Y-m-d H:i:s', $raw['updated']);
			$result['data'][$key]['lastpost'] = date('Y-m-d H:i:s', $raw['lastpost']);

			// выбрать последний добавленный пост
			$result['data'][$key]['last'] = $db->selectRow(
				'SELECT
					msg_id AS id,
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

		$result['maxdate'] = date('Y-m-d H:i:s', max($maxd));

		switch ($sort):
			
			case 'updated':
				$result['data'] = sort_result($result['data'], 'updated', $reverse);
			break;

		endswitch;

	break;

	
	// считываем обновления в списке тем
	case 'wait_topic':

		// отнимаем три лишних нолика микросекунд, прилетевшие из js, делаем числом
		$req_maxdate_ts = substr($_REQUEST['maxdate'], 0, strlen($_REQUEST['maxdate'])-3)*1;

		// Получаем массив всех тем $topics, в форме 'id темы' => 'id ее последнего поста'
		$topics = $db->select(
			'SELECT msg_id AS ARRAY_KEY, msg_id FROM ?_messages
			WHERE msg_topic_id = 0 AND msg_deleted <=> NULL'
		);
		foreach ($topics as $topic_id => $none):
			$topics[$topic_id] = $db->selectCell(
				'SELECT msg_id FROM ?_messages
				WHERE msg_deleted <=> NULL AND (msg_topic_id = ?d OR msg_id = ?d)
				ORDER BY msg_id DESC LIMIT 1'
				, $topic_id, $topic_id
			);
		endforeach;

		// для каждой темы выбираем дату последнего обновления в виде timestamp и кол-во постов
		foreach ($topics as $topic_id => $none):
			$raw = $db->selectRow(
				'SELECT 
					UNIX_TIMESTAMP(GREATEST(MAX(msg_created), IFNULL(MAX(msg_modified), 0))) AS maxdate,
					COUNT(*) AS count
				FROM ?_messages
				WHERE 
					(msg_topic_id = ?d OR msg_id = ?d)
					AND msg_deleted <=> NULL'
				, $topic_id, $topic_id
			);

			$cur_maxdates[$topic_id] = $raw['maxdate']*1; // числовые значения
			$result['quant'][$topic_id] = $raw['count'];
		endforeach;

		$result['new_quant'] = '0';
		$cur_latest_maxdate_ts = max($cur_maxdates); // дата последнего обновления
		$req_maxdate_sql = date('Y-m-d H:i:s', $req_maxdate_ts); // дата пришедшая с запросом

		if ($cur_latest_maxdate_ts > $req_maxdate_ts): // если есть хоть одна дата новее чем указанная

			// выбрать информацию о записях, если это последний или первый пост и их дата больше заданной
			foreach ($topics as $topic_id => $last_post_id):
				$raw = $db->select(
					'SELECT
						msg_id AS id,
						msg_topic_id AS topic_id,
						msg_topic AS topic,
						LEFT(msg_body, ?d) AS message,
						msg_created AS created,
						msg_modified AS modified,
						GREATEST(msg_created, IFNULL(msg_modified,0)) AS maxdate,
						usr_login AS author
					FROM ?_messages, ?_users
					WHERE
						`msg_author` = `usr_id`
						AND (msg_id = ?d OR msg_id = ?d)
						AND (msg_created > ? OR msg_modified > ?)
						AND msg_deleted <=> NULL'
					, $cfg['cut_length'], $topic_id, $last_post_id, $req_maxdate_sql, $req_maxdate_sql
				);

				if ($raw): $result['data'][$topic_id] = $raw;
				// иначе (если есть изменения, но не в первом или последнем посте) выдать только номер темы
				elseif ($cur_maxdates[$topic_id] > $req_maxdate_ts): $result['data'][$topic_id] = $topic_id;
				endif;

			endforeach;

			$result['new_quant'] = count($result['data']);

		endif;

		$result['maxdate'] = date('Y-m-d H:i:s', $cur_latest_maxdate_ts);

		$result['console'] = 'TOPICS: '.$req_maxdate_sql.' -> '.$result['new_quant'];

	break;
	
?>