<?php
/**
 * Created by JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:31 PM
 * To change this template use File | Settings | File Templates.
 */
class Environment {
    var $uagent, $path, $getstr, $get, $locale;

    // конструктор
    function __construct(){
        $this->uagent = $_SERVER['HTTP_USER_AGENT'];
        list($this->path, $this->getstr) = explode('?', $_SERVER['REQUEST_URI']);
        $this->get = $_GET;
    }

    // установка локали
    function set_locale($str) {

        // локаль - всегда в нижнем регистре
        $str = strtolower($str);

        // исправляем возможные ошибки
        if ($str == 'utf8') $str = 'utf-8';

        $this->locale = $str;

        header ('Content-type:text/html;charset='.$str.';');
    }
}
