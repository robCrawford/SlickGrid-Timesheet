<?php
//Manually get hash for a password!
$password = "sg_timesheet";
$salt = "SALT-GOES-HERE";
$pwHash = hash('sha256', $password."{". $salt ."}");

echo($pwHash);
?>