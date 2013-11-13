<?php
require_once './includes/backend_initial.php';

$suggest = $_REQUEST['suggest'];
$subject = $_REQUEST['subject'];

switch ($suggest):
	
	case 'on_topics':

		$subjects = explode(' ', trim($subject));

		$result = $db->select(
			'SELECT
				  id
				, name
				, type
				, strict
			FROM ?_tags
			WHERE name REGEXP ?
			LIMIT 10
			', implode('|', $subjects)
		);
		
	break;
	
	default:

		$result = 'command not found';

endswitch;

$GLOBALS['_RESULT'] = $result;
?>
