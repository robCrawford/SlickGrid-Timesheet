<?php
//Reverse magic quotes
if(function_exists('get_magic_quotes_gpc') && get_magic_quotes_gpc() === 1){
  $_POST = array_map( 'stripslashes', $_POST );
  $_GET = array_map( 'stripslashes', $_GET );
  $_COOKIE = array_map( 'stripslashes', $_COOKIE );
}

//Get current page URL
function getPageURL(){
	$pageURL = 'http';
	if(!empty($_SERVER["HTTPS"]))$pageURL .= "s";
	$pageURL .= "://";
	if($_SERVER["SERVER_PORT"] != "80"){
		$pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
	} 
	else{
		$pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
	}
	return $pageURL;
}

//CURL
function curl_get($url){
	$ch = curl_init();
	$timeout = 40;
	curl_setopt($ch,CURLOPT_URL,$url);
	curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,$timeout);
	$data = curl_exec($ch);
	$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	if($httpCode==200)return $data;
	else return false;
}

/**********************************************
 * Login
 **********************************************/
function createUserSession($username, $level){
	@session_start(); //Suppress warnings
	$_SESSION["username"] = $username;
	$_SESSION["level"] = $level;
}

function doLogin($username, $password){
	$correctLogin = false;
	$errMsgId = 1;

	//Look for username row
	$result = preparedStmt("SELECT id, username, level, enabled, failed_logins, password, salt FROM users WHERE username=?",array("s","$username"));
	$userData = $result?$result[0]:0;

	//If username exists
	if($userData){
		$userId = $userData['id'];
		$pwHash = hash('sha256', $password."{". $userData['salt'] ."}");

		//If account is disabled - send error
		if(!$userData['enabled'])$errMsgId = 2;

		//Else check password
		else if($userData['password']==$pwHash){
			$correctLogin = true;
			$level = $userData['level'];
			//'Remember me' checkbox - http://tycoontalk.freelancer.com/php-forum/47470-tip-passwords-security-remember-me.html
			if($_POST['rememberme']){
				$cookieHash = hash('sha256', $userData['password']."{". $userData['salt'] ."}"); //Hash of pw hash+salt
				$expire = time() + 7776000; //90 days
				setcookie('sg_timesheetUN', $userData['username'], $expire, "/"); //Make available from root
				setcookie('sg_timesheetPW', $cookieHash, $expire, "/");
			}
		}

		//Log failed attempts & disable account after 10 wrong tries
		if(!$correctLogin && $userData['enabled']){
			$failedLogins = $userData['failed_logins']+1;
			if($failedLogins>9){
				$result = preparedStmt("UPDATE users SET enabled=0 WHERE id=?",array("i",$userId));
			}
			$result = preparedStmt("UPDATE users SET failed_logins=$failedLogins WHERE id=?",array("i",$userId));
		}
	}

	// Successful - Flatten incorrect logins and start session
	if($correctLogin){
		$result = preparedStmt("UPDATE users SET failed_logins=0 WHERE id=?",array("s",$userId));
		createUserSession($userData['username'], $level);
	}

	return array("success"=>$correctLogin,"msgId"=>$errMsgId);
}

/***************************************************************************
 * Mysqli prepared statement
 * Returns either an array of results rows (for SELECT) i.e. $result[0]['site_label']
 * or array with one entry - "affected_rows" i.e. $result["affected_rows"]
 **************************************************************************/
function preparedStmt($query, $bindParamArgs){
	$mysqli = $GLOBALS['mysqli'];
	$result = array();

	if($stmt = $mysqli->prepare($query)){

        $tmp = array(); //Has to be by reference
        foreach($bindParamArgs as $key => $value) $tmp[$key] = &$bindParamArgs[$key];
        call_user_func_array(array($stmt, 'bind_param'), $tmp);

		$stmt->execute();
		//$stmt->store_result();

		if(substr($query, 0, 6)=="SELECT"){//If SELECT - Bind results & compile into returned array
			$meta = $stmt->result_metadata();
			while($field = $meta->fetch_field())$params[] = &$row[$field->name];
			call_user_func_array(array($stmt, 'bind_result'), $params);

			while($stmt->fetch()){
				foreach($row as $key => $val)$c[$key] = $val;
				$result[] = $c;
			}
		}
		else{//If not SELECT then return number of affected rows
			$result["affected_rows"] = $stmt->affected_rows;
		}

		//$stmt->free_result();
		$stmt->close();
	}
	else die("Error in query: ".$query);

	return $result;
}

?>
