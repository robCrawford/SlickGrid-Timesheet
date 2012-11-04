<?php
include "config/settings.php";
include "includes/db_connect.php";
include "includes/utils.php";
include "includes/test_login_user.php";
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Timesheet</title>

<!-- CSS -->
<link rel="stylesheet" href="slickgrid/css/smoothness/jquery-ui-1.8.5.custom.css" type="text/css" media="screen" charset="utf-8" />
<link rel="stylesheet" href="slickgrid/examples/examples.css" type="text/css" media="screen" charset="utf-8" />
<link rel="stylesheet" href="css/sg_timesheet.css" type="text/css" />
<link rel="stylesheet" href="config/override.css" type="text/css" />

<!-- Slickgrid CSS -->
<link href="slickgrid/slick.grid.css" media="screen" rel="stylesheet" type="text/css" />
<link href="slickgrid/slick.columnpicker.css" media="screen" rel="stylesheet" type="text/css" />

<!-- jQuery -->
<script src="slickgrid/lib/jquery-1.4.4.js" type="text/javascript"></script>
<script src="slickgrid/lib/jquery-ui-1.8.5.custom.min.js" type="text/javascript"></script>

<!-- Slickgrid JS -->
<script src="slickgrid/lib/jquery.event.drag-2.0.custom.js" type="text/javascript"></script>
<script src="slickgrid/lib/jquery.cookie-1.0.js" type="text/javascript"></script>
<script src="slickgrid/lib/jquery.json-2.2.min.js" type="text/javascript"></script>
<script src="slickgrid/slick.grid.js" type="text/javascript"></script>
<script src="slickgrid/slick.columnpicker.js" type="text/javascript"></script>
<script src="slickgrid/slick.session.js" type="text/javascript"></script>
<script src="slickgrid/slick.filter.js" type="text/javascript"></script>
<script src="slickgrid/slick.editors.js" language="JavaScript"></script>
<script src="slickgrid/init.js" type="text/javascript"></script>

<!-- Downloadify JS -->
<script type="text/javascript" src="downloadify/js/swfobject.js"></script>
<script type="text/javascript" src="downloadify/js/downloadify.min.js"></script>

<!-- Timesheet JS -->
<script type="text/javascript">
var loggedInUser = '<?php echo $_SESSION["username"]; ?>',
	isAdmin = '<?php echo $_SESSION["level"]=="administrator"; ?>';
</script>
<script src="js/sg_timesheet.js" type="text/javascript"></script>
</head>
<body>
<div id="toolbar">
	<div id="toolbar_lhs">
		<div id="logOutBtn" class="pseudo-button"> Log out </div>
		<div id="exportBtn" class="pseudo-button"><div id="downloadify"></div></div>
		<div id="undoBtn" class="pseudo-button"> &#8617; Undo cell edit </div>
	</div>
	<div id="toolbar_mid">
		<div class="els">
			<select id="numRowsSelect">
				<option value="500">Num rows: 500</option>
				<option value="5000">Num rows: 5000</option>
				<option value="1000000000">Num rows: All</option>
			</select>
			<div id="showDltdRows" class="checkBoxWrapper"><input id="showDltdRowsChx" type="checkbox" class="checkBox" />Show deleted rows</div>
			<div id="autoEdit" class="checkBoxWrapper"><input id="autoEditChx" type="checkbox" class="checkBox" />Auto Edit</div>
			<div id="autoSave" class="checkBoxWrapper"><input id="autoSaveChx" type="checkbox" class="checkBox" />Auto Save</div>
		</div>
	</div>
	<div id="toolbar_rhs">
		<div id="saveBtn" class="pseudo-button"> SAVE &raquo; </div>
		<div id="addRowBtn" class="pseudo-button"> + New row </div>
		<div class="clearFloats"></div>
	</div>
	<div class="clearFloats"></div>
</div>
<div id="gridWrapper" class="slickgrid" style="width: 100%; height: 500px;"></div>

</body>
</html>