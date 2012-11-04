<?php
session_start();
session_destroy();

$expire = time()-3600;
setcookie('sg_timesheetUN', "", $expire, "/");
setcookie('sg_timesheetPW', "", $expire, "/");

header("Location:../");
?>