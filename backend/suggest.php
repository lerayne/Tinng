<?php
require_once './includes/backend_initial.php';

$suggest = $_REQUEST['suggest'];
$subject = $_REQUEST['subject'];

switch ($suggest):
	
	case 'on_topics':
		
		$result = $db->select(
			'SELECT
				  id
				, name
				, type
				, strict
			FROM ?_tags
			WHERE name LIKE ?
			LIMIT 10
			', '%'.$subject.'%'
		);
		
	break;
	
	default:

		$result = 'command not found';

endswitch;

$GLOBALS['_RESULT'] = $result;
?>
