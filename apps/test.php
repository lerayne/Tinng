<?php
/**
 * Created by JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 7/11/13
 * Time: 3:34 PM
 * To change this template use File | Settings | File Templates.
 */
//header ("Content-type:text/html;charset=utf-8;");
//mail('myegorov@anromsocial.com', 'test subject', 'test message', "From:Tinng <noreply@tinng.net>");

include '../libraries/DbSimple/Generic.php';
$db = DbSimple_Generic::connect('mysql://tinng_main:maedanaena884@localhost/tinng');

echo $db->select('SELECT * FROM tinng_messages');