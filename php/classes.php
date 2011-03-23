<?php
/* ООП для пхп :) */

class User {

	function __construct($row) {

		foreach ($row as $key => $val):
			$valname = str_replace('usr_', '', $key);
			$this->$valname = $val;
		endforeach;
	}
}

?>
