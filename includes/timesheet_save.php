<?php
include "../config/settings.php";
include "db_connect.php";
include "utils.php";
include "test_login_user.php";

$json = json_decode($_POST['json']);
$result = "";
$newIds = array();

//Cycle through changed rows
foreach($json as $id=>$row){
	$action = $row->action;
	$data = $row->data;
		$who = isset($data->who)?$data->who:"";
		$date_timestamp = isset($data->date_timestamp)?$data->date_timestamp:"";
		$time_start = isset($data->time_start)?$data->time_start:"";
		$time_end = isset($data->time_end)?$data->time_end:"";
		$description = isset($data->description)?$data->description:"";
		$jobnum = isset($data->jobnum)?$data->jobnum:"";
		$client = isset($data->client)?$data->client:"";
		$contact = isset($data->contact)?$data->contact:"";
		$total_mins = isset($data->total_mins)?$data->total_mins:"";
		$complete = isset($data->complete)?$data->complete:"";
		$status = isset($data->status)?$data->status:"";

	if($action == "edit"){
		if(intval($id)<100){ //If id < 100, it's a temp id so a new row
			//Row is new
			$result = preparedStmt("INSERT INTO timesheet (who,date_timestamp,time_start,time_end,description,jobnum,client,contact,total_mins,complete,last_change,status) VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),1)",array("sisssissii",$who,$date_timestamp,$time_start,$time_end,$description,$jobnum,$client,$contact,$total_mins,$complete));
			$newId = mysqli_insert_id($mysqli); //Get last index created
			$newIds[$id] = $newId; //Save for updating front end
		}
		else{ 
			//Row already exists
			$result = preparedStmt("UPDATE timesheet SET who=?,date_timestamp=?,time_start=?,time_end=?,description=?,jobnum=?,client=?,contact=?,total_mins=?,complete=?,last_change=NOW(),status=? WHERE id=?",array("sisssissiiii",$who,$date_timestamp,$time_start,$time_end,$description,$jobnum,$client,$contact,$total_mins,$complete,$status,$id));
		}
	}

	if($action == "remove"){
		//Soft delete only - sets status to 0
		if(intval($id)>99){ //Less than 100 is temp ids for new rows
			$result = preparedStmt("UPDATE timesheet SET status=0 WHERE id=?",array("i",$id));
		}
	}
}

$retArray = array("status"=>$result?1:0, "newIds"=>$newIds);

echo json_encode($retArray);
?>