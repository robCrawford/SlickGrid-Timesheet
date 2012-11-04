<?php
$mysqli = new mysqli(DBHOST, DBUSERNAME, DBPASSWORD, DBNAME);
if(mysqli_connect_errno()){
    printf("Connect failed: %s\n", mysqli_connect_error());
    exit();
}
?>