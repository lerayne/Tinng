<?php

class User {

    function __construct($row) {

        foreach ($row as $key => $val):
            $valname = str_replace('uset_', '', $key);
            $this->$valname = $val;
        endforeach;

		if ($this->portrait == 'gravatar') {
			$this->portrait = 'http://www.gravatar.com/avatar/' . md5(strtolower($this->email)) . '?s=48';
		}
    }
}
