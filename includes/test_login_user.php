<?php
session_start();

if(!isset($_SESSION["username"])){
	$isRememberedLogin = "";

	//Test for remember me cookie
	if(isset($_COOKIE['sg_timesheetUN'], $_COOKIE['sg_timesheetPW'])){
		$username = $_COOKIE['sg_timesheetUN'];

		//Look for username row
		$result = preparedStmt("SELECT username, password, level, enabled, salt FROM users WHERE username=?",array("s",$username));
		$userData = $result?$result[0]:0;

		if($userData){
			if($userData['enabled']){
				$cookieHash = hash('sha256', $userData['password']."{". $userData['salt'] ."}"); //Hash of pw hash+salt

				if($cookieHash == $_COOKIE['sg_timesheetPW']){
					$isRememberedLogin = true;
					createUserSession($username, $userData['level']);
				}
			}
		}

	}

	if(!$isRememberedLogin){
		$_SESSION["deniedURL"] = getPageURL();
		header("Location:login_page.php");
		exit();
	}
}

?>