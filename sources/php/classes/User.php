<?php

class User {

	protected $email;
	protected $hash;

    function __construct($row) {

		$private_fields = Array('email', 'hash');

        foreach ($row as $key => $val):
            $valname = str_replace('uset_', '', $key);
			$this->$valname = $val;
        endforeach;

		if ($this->avatar == 'gravatar') {
			$this->avatar = 'http://www.gravatar.com/avatar/' . md5(strtolower($this->email)) . '?s=48';
		}
    }
}
