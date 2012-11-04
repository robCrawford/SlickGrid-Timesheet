<?php
include "../config/settings.php";
include "db_connect.php";
include "utils.php";

$login = doLogin($_POST['username'],$_POST['password']);
$mysqli->close();

if($login['success']){
	if(!empty($_SESSION["deniedURL"])){
		$url = $_SESSION["deniedURL"];
		unset($_SESSION["deniedURL"]);
		header("Location:".$url);
	}
	else header("Location:../"); //Default destination
}
else header("Location:../login_page.php?msg=" . $login['msgId']); //Back to login page with error

?>