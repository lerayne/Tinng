<?php
/* функции для пхп-движка, использующиеся повсеместно в скрипте */

$rex['email'] = '/^[\_]*([a-z0-9]+(\.|\_*)?)+@([a-z][a-z0-9\-]+(\.|\-*\.))+[a-z]{2,6}$/';
$rex['login'] = '/^[a-zA-Z0-9_]{4,16}$/';
$rex['pass'] = '/^[a-zA-Z0-9_]{6,32}$/';
$rex['empty'] = '/\s+/g';

function safe_str($str){
    return strip_tags($str,
        '<br><strong><b><em><i><span><div><ol><ul><li><sub><sup><hr><h2><h3><h4><blockquote>'
    );
}

function jsts2phpts ($str){
    return substr($str, 0, strlen($str)-3);
}

function jsts2sql($str){
    return date('Y-m-d H:i:s', jsts2phpts($str));
}

function incl_css(){
    $arr = func_get_args();
    foreach ($arr as $val):
        echo '<link rel="stylesheet" type="text/css" href="'.$val.'?N">'."\n";
    endforeach;
}

function incl_scripts(){
    $arr = func_get_args();

    global $safecfg, $display_mode;

    if ($safecfg['production']){

        $script = '';

        foreach ($arr as $val):
            $script .= file_get_contents($val);
        endforeach;

        $filename = 'data/compiled_js/'.$display_mode.'_'. md5($script) .'.js' ;

        if (!file_exists($filename)){

            $dir = opendir('data/compiled_js/');
            while (($file = readdir($dir)) !== false) {
                if (!(strpos($file, $display_mode) === false)) unlink('data/compiled_js/'.$file);
            }

            $conn = curl_init("http://closure-compiler.appspot.com/compile");

            $param[] = 'js_code='.urlencode($script);
            $param[] = 'compilation_level=SIMPLE_OPTIMIZATIONS';
            $param[] = 'output_info=compiled_code';

            curl_setopt($conn, CURLOPT_POST, true);
            curl_setopt($conn, CURLOPT_POSTFIELDS, join('&', $param));
            curl_setopt($conn, CURLOPT_RETURNTRANSFER, true);

            $compiled_script = curl_exec($conn);

            file_put_contents($filename, ($compiled_script) ? $compiled_script : $script);
        }

        echo '<script type="text/javascript" language="JavaScript" src="'.$filename.'"></script>';

    } else {

        foreach ($arr as $val):
            echo '<script type="text/javascript" language="JavaScript" src="'.$val.'"></script>'."\n";
        endforeach;
    }
}

function now($format = false){
    return ($format == 'sql') ? date('Y-m-d H:i:s') : time();
}

Class Everything {

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

$e = new Everything();

class User {

    function __construct($row) {

        foreach ($row as $key => $val):
            $valname = str_replace('uset_', '', $key);
            $this->$valname = $val;
        endforeach;
    }
}
