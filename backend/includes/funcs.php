<?php
/**
 * Created by PhpStorm.
 * User: Lerayne
 * Date: 09.02.14
 * Time: 18:41
 */

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
function ready_row($row) {

	// убираем из сообщений об удаленных рядах всю лишнюю инфу
	if ($row['deleted'] || $row['noaccess']) {

		$cutrow['deleted'] = 1;
		$cutrow['id'] = $row['id'];
		$cutrow['author'] = $row['author'];
		$cutrow['created'] = $row['created'];
		unset($row);
		$row = $cutrow;

	} else { // Если работаем не с отчетом об удалении

		if ($row['author_avatar'] == 'gravatar') {
			$row['author_avatar'] = 'http://www.gravatar.com/avatar/' . md5(strtolower($row['author_email'])) . '?s=50';
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
function sort_by_field($array, $field, $reverse = false) {

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
	$chunks = explode('+', $string);
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

	$tags = explode('+', $string);
	$arr = array();

	if (count($tags) && $tags[0] != '') {
		$arr = $db->selectCol('SELECT id FROM ?_tags WHERE name IN (?a)', $tags);
	}

	return $arr;
}

function add_tags($tags, $message_id){
	if (count($tags)) {

		global $db;

		foreach ($tags as $tag) {

			if (!is_array($tag)) {
				$tag = array(
					'name' => $tag,
					'type' => 'user'
				);
			}

			$tag_id = $db->selectCell('SELECT id FROM ?_tags WHERE name = ?', $tag['name']);

			if (!$tag_id) {

				$tag_id = $db->query('INSERT INTO ?_tags (?#) VALUES (?a)', array_keys($tag), array_values($tag));
			}

			$new_tagbind = array(
				'message' => $message_id,
				'tag' => $tag_id
			);

			$db->query('INSERT INTO ?_tagmap (?#) VALUES (?a)', array_keys($new_tagbind), array_values($new_tagbind));
		}
	}
}

function get_dialogue($dialogue) {
	global $db, $user;

	if ($user->id == 0 || $dialogue == $user->id) return null;

	$topic = $db->selectCell('
		SELECT msg.id
		FROM ?_messages msg
			JOIN ?_private_topics my_access ON my_access.message = msg.id AND my_access.level IS NOT NULL AND my_access.user = ?d
			JOIN ?_private_topics elses_access ON elses_access.message = msg.id AND elses_access.level IS NOT NULL AND elses_access.user = ?d
		WHERE msg.dialogue = 1
		GROUP BY msg.id
		'
		, $user->id
		, $dialogue
	);

	return $topic;
}


function ready_users($data, $delete_email_after = false) {

	$to_process = is_assoc($data) ? array(0 => $data) : $data;

	foreach ($to_process as $key => $val) {
		if ($val['avatar'] == 'gravatar') {
			$val['avatar'] = 'http://www.gravatar.com/avatar/' . md5(strtolower($val['email'])) . '?s=50';
		}

		if ($val['display_name'] == null) $val['display_name'] = $val['login'];

		if (is_array($val) && $delete_email_after) unset($val['email']);

		$processed[$key] = $val;
	}

	return is_assoc($data) ? $processed[0] : $processed;
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