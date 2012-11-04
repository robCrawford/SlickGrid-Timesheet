<?php
include "../config/settings.php";
include "db_connect.php";
include "utils.php";
include "test_login_user.php";

$loggedInUser = $_SESSION["username"];
$numRows = $_GET['numrows'];
$showDeleted = $_GET['showdeleted'];
$selectStmt = "SELECT id,who,date_timestamp,time_start,time_end,description,jobnum,client,contact,total_mins,complete,status FROM timesheet ";

if($_SESSION["level"]=="administrator"){ //Admins get everyone's entries
	if($showDeleted)$entries = preparedStmt($selectStmt . "ORDER BY date_timestamp DESC LIMIT ?",array("i",$numRows));
	else $entries = preparedStmt($selectStmt . "WHERE status=1 ORDER BY date_timestamp DESC LIMIT ?",array("i",$numRows));
}
else{
	if($showDeleted)$entries = preparedStmt($selectStmt . "WHERE who=? ORDER BY date_timestamp DESC LIMIT ?",array("si",$loggedInUser,$numRows));
	else $entries = preparedStmt($selectStmt . "WHERE who=? AND status=1 ORDER BY date_timestamp DESC LIMIT ?",array("si",$loggedInUser,$numRows));
}
$sep = "";
$returnStr = "[";

foreach($entries as $i=>$row){
	$returnStr .= $sep . json_encode($row);
	$sep = ",";
}

$returnStr .= "]";

echo $returnStr;
?>