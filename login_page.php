<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title> Please log in </title>
<style type="text/css">
body{
	font: 12px sans-serif;
	background: #eee;
}
form{
	position: absolute;
	padding: 10px 20px;
	border: 1px solid #aaa;
}
input{
	margin: 5px 5px 5px 0;
}
.submit{
	margin-top: 10px;
	float: right;
}
</style>
</head>
<body>

<form method="post" action="includes/log_in.php">
<?php
	if(isset($_GET['msg'])){ //Messages
		$messageNum = $_GET['msg'];
		if($messageNum==1)echo "<i style='color:#ff0000'>* Incorrect login! *</i><br /><br />";
		if($messageNum==2)echo "<i style='color:#ff0000'>* Your account has been locked! *<br /><br />";
	}
?>
<strong>Please log in</strong><br />
<input type="text" name="username" /><br />
<input type="password" name="password" /><br />
<input type="checkbox" name="rememberme" checked="checked" />Remember me<br />
<input type="submit" class="submit" value="Go &raquo;" />
</form>

</body>
</html>