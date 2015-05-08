(function($, Slick, window, document, undefined){

	var prefs = {"numRowsIndex":0,"showDeletedRows":0,"autoEdit":isAdmin?0:1,"autoSave":1}, //Defaults
		prefsCookieName = isAdmin?"sg_timesheetPrefs-admin":"sg_timesheetPrefs",
		savedPrefs = getSavedPrefs(); //Prefs from cookie
	if(savedPrefs)prefs = savedPrefs; //Overwrite if saved

	/*
	   Create grid
	*/
	var tempId = 1, //In DB ids start at 100 to allow temp ids
		changedRows = {}, //Keep a record of which rows have changed
		data = [], //Stores grid data
		grid = {
			id: 'timesheet', //Unique ID for this table, for session handling
			container: '#gridWrapper',
			options: {
				session: false, //Enable client-side session
				grid: {
					editable: true,
					enableCellNavigation: true,
					asyncEditorLoading: false,
					autoEdit: prefs.autoEdit,
					editCommandHandler: queueAndExecuteCommand
				}
			},
			columns: [
				{id:"who", name:'Who', field: 'who', filter: 'text', editor: TextCellEditor, visible: isAdmin}, //Only visible by default for admin
				{id:"date_timestamp", name:'Date', field: 'date_timestamp', filter: 'range', editor: timestampCellEditor, formatter: timestampCellFormatter, defaultSort: 'descending'}, //Sort on load
				{id:"time_start", name: 'Time Start', field: 'time_start', editor: TextCellEditor, validator: timeFieldValidator, formatter: timeFieldFormatter},
				{id:"time_end", name: 'Time End', field: 'time_end', editor: TextCellEditor, validator: timeFieldValidator, formatter: timeFieldFormatter},
				{id:"description", name: 'Description', field: 'description', filter: 'text', editor:LongTextCellEditor},
				{id:"jobnum", name: 'Job Number', field: 'jobnum', filter: 'text', editor: TextCellEditor},
				{id:"client", name: 'Client', field: 'client', filter: 'text', editor: TextCellEditor},
				{id:"contact", name: 'Contact', field: 'contact', filter: 'text', editor: TextCellEditor, visible: isAdmin}, //Only visible by default for admin
				{id:"total_mins", name: 'Time Total', field: 'total_mins', total:"sum", formatter: timeTotalFormatter},
				{id:"complete", name:"Complete", field:"complete", filter: 'text', width:50, minWidth:20, maxWidth:50, cssClass:"center", formatter: BoolCellFormatter, editor: YesNoCheckboxCellEditor, visible: isAdmin}, //Only visible by default for admin
				{id:"+", name: '+', field: '+', sortable: false, width: 30, maxWidth:30, resizable: false, unselectable:true, alwaysDisplay:true, formatter: duplicateRowFormatter, visible: !isAdmin}, //Not visible by default for admin
				{id:"status", name: 'x', field: 'status', sortable: false, width: 30, maxWidth:30, resizable: false, unselectable:true, alwaysDisplay:true, formatter: statusRowFormatter}
			],
			totals: {}, //Created on load below
			data: data,
			update: function(saveToDb){ //Arg to also save data to DB
				grid.View.setItems(data);
				grid.Grid.resizeGrid(); //Refreshes display
				if(prefs.autoSave){
					if(saveToDb)saveData();
				}
			}
		};
	dataGrids.push(grid);

	/*
	   DOM ready
	*/
	$(function(){
		//Initialise downloadify for CSV exporting
		initDownloadify();

		//numRows selectbox
		setNumRowsSelect();
		$("#numRowsSelect").change(function(){
			if(confirm("OK to refresh grid?")){
				prefs.numRowsIndex = $(this).attr("selectedIndex");
				savePrefs();
				window.location.reload();
			}
			else setNumRowsSelect();
		});

		//showDeletedRows checkbox
		setCheckboxFromVar("showDltdRowsChx",prefs.showDeletedRows);
		$("#showDltdRows").click(function(){
			if(confirm("OK to refresh grid?")){
				prefs.showDeletedRows = !prefs.showDeletedRows*1;
				savePrefs();
				window.location.reload();
			}
			else setCheckboxFromVar("showDltdRowsChx",prefs.showDeletedRows);
		});

		//autoEdit checkbox
		setCheckboxFromVar("autoEditChx",prefs.autoEdit);
		$("#autoEdit").click(function(){
			if(confirm("OK to refresh grid?")){
				prefs.autoEdit = !prefs.autoEdit*1;
				savePrefs();
				window.location.reload();
			}
			else setCheckboxFromVar("autoEditChx",prefs.autoEdit);
		});

		//autoSave checkbox
		setCheckboxFromVar("autoSaveChx",prefs.autoSave);
		$("#autoSave").click(function(){
			if(confirm(prefs.autoSave?"Turn off auto save?":"Turn on auto save?")){
				prefs.autoSave = !prefs.autoSave*1;
				$("#autoSaveChx").attr('checked',prefs.autoSave?'checked':0);
				savePrefs();
			}
			else setCheckboxFromVar("autoSaveChx",prefs.autoSave);
		});

		//Set click events on buttons
		$("#logOutBtn").click(logOut);
		$("#undoBtn").click(undo);
		$("#saveBtn").click(saveData);
		$("#addRowBtn").click(addRow);

		//Get data - number of rows is from selectbox value
		$.getJSON('includes/timesheet_get.php?numrows='+$("#numRowsSelect").val()+'&showdeleted='+prefs.showDeletedRows, function(jsonOb){
			data = jsonOb;
			grid.update(); //Don't save, only just got data
			grid.View.calculateTotals(); //Init total row
		});

		//Add onCellChange func
		grid.Grid.onCellChange = function(currRow, currCell, item){
			changedRows[item.id]={action:"edit",data:item}; //Save row as edited
			updateTotalsAndSave(currRow); //In case cell was a time cell
		};

		//Add grid onRender method (added to slick.grid.js)
		if(prefs.showDeletedRows){
			Slick.Grid.onRender = function(){
				//Grey out deleted rows if viewing them
				$('.deletedRow').parent().parent().find("div").css({"text-decoration":"line-through","color":"#888"}).find(".clockBtn").hide();
			}
		}

		//Add events for clicking away from grid
		function commitEdits(){
			grid.Grid.getEditController().commitCurrentEdit();
		}
		$(document).click(function(e){
			var clickTg = e.target;
			if(clickTg){
				var nodeNm = clickTg.nodeName.toLowerCase(),
					isInput = (nodeNm=="input" || nodeNm=="textarea"),
					isFiltered = hasClass(clickTg, "slick-cell") || hasClass(clickTg, "ui-datepicker") || hasClass(clickTg, "ui-icon") || hasClass(clickTg, "pseudo-button") || hasClass(clickTg, "ui-icon") || /flash/.test(clickTg.type); //Export btn is a swf
				if(!isInput && !isFiltered){
					grid.Grid.setSelectedRows([]); //Remove any rows selection
					commitEdits();
				}
			}
		});
	});

	/*
	   Undo
	*/
	var commandQueue = [];

	function queueAndExecuteCommand(item,column,editCommand){
		commandQueue.push(editCommand);
		editCommand.execute();
	}

	function undo(){
		var command = commandQueue[commandQueue.length-1];
		if(command && Slick.GlobalEditorLock.cancelCurrentEdit()){
			if(confirm('Undo cell edit - revert "'+command.serializedValue+'" to "'+command.prevSerializedValue+'"?')){
				commandQueue.pop();
				var item = data[command.row];
				changedRows[item.id]={action:"edit",data:item}; //Save row as edited
				command.undo();
				updateTotalsAndSave(command.row); //Automatically saves
				grid.Grid.gotoCell(command.row,command.cell,false);
			}
		}
	}

	/*
	  Cell display/edit
	*/
	//Date timestamp field
	/* dd/mm/yyyy formatted date formatter + editor (from timestamp)
	   !timestamp is in seconds, not milliseconds! (Unix timestamp) */
	function timestampCellFormatter(row, cell, value, columnDef, dataContext){
		if(value == null || value === "" || value==0)return "";
		var dataRow = getDataRow(row);

		//Re-calculate timestamp based on time_start entry for row
		//Ensures stacking order is correct in grid
		var timeArr = dataRow.time_start.split(":"),
			totalMins = 0;
		if(timeArr[0])totalMins = (timeArr[0]*60)+timeArr[1]*1; //Get number of seconds from time string

		//Update value by adding minutes from time_start to 00:00 of day from timestamp
		value = getDayStartTimestamp(value) + totalMins;
		dataRow.date_timestamp = value; //Overwrite timestamp in data ob

		var thedate = $.datepicker.parseDate("@", value * 1000);
		return $.datepicker.formatDate("dd/mm/yy", thedate);
	}

	function timestampCellEditor(args){
		var $input,
			defaultValue,
			calendarOpen = false;

		this.init = function() {
			$input = $("<INPUT type=text class='editor-text' />");
			$input.appendTo(args.container);
			$input.focus().select();
			$input.datepicker({
				showOn: "button",
				buttonImageOnly: true,
				buttonImage: "images/calendar.gif",
				beforeShow: function() { calendarOpen = true },
				onClose: function() { calendarOpen = false },
				dateFormat: "dd/mm/yy"
			});
			$input.width($input.width() - 18);
		};
		
		this.destroy = function() {
			$.datepicker.dpDiv.stop(true,true);
			$input.datepicker("hide");
			$input.datepicker("destroy");
			$input.remove();
		};

		this.show = function() {
			if (calendarOpen) {
				$.datepicker.dpDiv.stop(true,true).show();
			}
		};

		this.hide = function() {
			if (calendarOpen) {
				$.datepicker.dpDiv.stop(true,true).hide();
			}
		};

		this.position = function(position) {
			if (!calendarOpen) return;
			$.datepicker.dpDiv
				.css("top", position.top + 30)
				.css("left", position.left);
		};

		this.focus = function() {
			$input.focus();
		};

		this.loadValue = function(item) {
			defaultValue = item[args.column.field];
			var thedate = $.datepicker.parseDate("@", defaultValue * 1000);
			defaultValue = $.datepicker.formatDate( "dd/mm/yy", thedate);
			$input.val(defaultValue);
			$input[0].defaultValue = defaultValue;
			$input.select();
		};

		this.serializeValue = function() {
			var thedate = $.datepicker.parseDate("dd/mm/yy", $input.val());
			return $.datepicker.formatDate("@", thedate) / 1000;
		};

		this.applyValue = function(item,state) {
			item[args.column.field] = state;
		};

		this.isValueChanged = function() {
			return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
		};

		this.validate = function() {
			return {
				valid: true,
				msg: null
			};
		};

		this.init();
	}

	//Time field format
	function timeFieldFormatter(row,cell,value,columnDef,dataContext){
		var todayDt = getFormattedTimestamp(getTime(true)),
			rowDt = getFormattedTimestamp(getDataRow(row).date_timestamp);

		//Only show clock button for rows created today (don't show for admin)
		if(todayDt!=rowDt || isAdmin)return value;
		valDisplay = (value || "") + " &nbsp; "; //Space before icon
		return valDisplay + '<a class="clockBtn" href="#" onclick="'+(columnDef.field=="time_start"?'Slick.ui.updateTimeStart':'Slick.ui.updateTimeEnd')+'(' + row + ',' + cell + ',\'' + (value || "") + '\');return false"><img src="images/clock.gif" border="0" title="Set time to now"></a>';
	}
	//Time field validate
	function timeFieldValidator(value){
		var timeArr = value.split(":"),
			validEntry = (timeArr.length==2 && timeArr[0]>=0 && timeArr[0]<24 && timeArr[1]>=0 && timeArr[1]<60 && timeArr[1].length==2);
		if(value=="")validEntry = 1; //Allow cleared field
		return validEntry?{valid:1}:{valid:0};
	}
	//Time total format
	function timeTotalFormatter(row,cell,value,columnDef,dataContext){
		return formatTotalMins(value);
	}
	//Duplicate button - not shown for admin
	function duplicateRowFormatter(row,cell,value,columnDef,dataContext){
		if(!isAdmin)return '<a href="#" class="dupBtn" onclick="Slick.ui.duplicateRow(' + row + ');return false"><img src="images/duplicate.gif" border="0" title="Duplicate row"></a>';
	}
	//Delete button
	function statusRowFormatter(row,cell,value,columnDef,dataContext){
		var isStatus0 = (value===0);
		var htmlStr = "";
		if(isStatus0)htmlStr = '<a href="#" class="deletedRow" onclick="Slick.ui.restoreRow(' + row + ');return false"><img src="images/restore.gif" border="0" title="Restore row"></a>';
		else htmlStr = '<a href="#" id="dltBtn'+row+'" onclick="Slick.ui.deleteRow(' + row + ');return false"><img src="images/delete.gif" border="0" title="Delete row"></a>';
		return htmlStr;
	}

	/*
	   Utils
	*/
	function getDataRow(rowDisplayIndex){
	//Get row from data ob that corresponds to display index
	//(When filtered the indexes will not match)
		var dataIndex;
		if(grid.View.rows[rowDisplayIndex]){ //If a row exists in the view at the index
			dataIndex = grid.View.getItemById(grid.View.rows[rowDisplayIndex].id); //(If the id doesn't exist dataIndex will be undefined i.e. new rows)
		}
		//When new rows are added with filters on, entry will not exist in View so corresponding data entry will be correct (as not filtered!)
		return dataIndex || data[rowDisplayIndex];
	}

	function setNumRowsSelect(){
	//Set number of rows selectbox
		$("#numRowsSelect")[0].selectedIndex = prefs.numRowsIndex;
	}

	function setCheckboxFromVar(id, settingVar){
	//Set checkbox to setting value i.e. 1/checked, 0/unchecked
		if(settingVar)$("#"+id).attr('checked','checked');
		else $("#"+id).attr('checked',0);
	}

	function removeArrayEntry(array, from, to){
	//Remove array entry
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		return array.push.apply(array, rest);
	}

	function hasClass(domOb, className){
	//Test for class when there are multiple classes
		return new RegExp(className).test(domOb.className);
	}

	function getTime(asTimestamp){
		var dt = new Date(),
			timeStr = "";
		if(asTimestamp)timeStr = parseInt(dt.getTime()/1000);
		else{
			var mins = dt.getMinutes();
			timeStr = dt.getHours()+":"+(mins<10?"0"+mins:mins);
		}
		return timeStr;
	}

	function getTotalMins(timeStr){
	//Get total mins from time string formatted hh:mm
		var timeArr = timeStr.split(":"),
			totalMins = 0;
		if(timeArr.length)totalMins = timeArr[0]*60 + timeArr[1]*1;
		return totalMins;
	}

	function formatTotalMins(totalMins){
	//Format total mins to hh:mm
		var minsMod = totalMins%60;
		return Math.floor((totalMins/60)||0) + " hrs" + (minsMod?", " + minsMod + " mins":"");
	}

	function calcTotalMins(rowIndex){
		var dataRow = getDataRow(rowIndex);
		if(!dataRow || !dataRow.time_start || !dataRow.time_end)return 0;
		var startMins = getTotalMins(dataRow.time_start),
			endMins = getTotalMins(dataRow.time_end),
			totalMins = (endMins - startMins) || 0;
		return totalMins;
	}

	function logOut(){
		if(confirm("Log out?")){
			document.location = "includes/log_out.php";
		}
	}

	//Preferences
	function savePrefs(){
		saveCookieJSON(prefsCookieName,prefs,3650); //Days (10 years)
	}
	function getSavedPrefs(){
		return readCookieJSON(prefsCookieName);
	}

	/*
	   Cookies
	*/
	function readCookieJSON(ckName){
	//Returns JS object as saved in ckName cookie
		var ckVal = readCookie(ckName);
		return ckVal?JSON.parse(decodeURIComponent(ckVal)):0;
	}

	function saveCookieJSON(ckName, ob, daysTTL){
	//Save JS object as JSON to ckName cookie
		writeCookie(ckName,encodeURIComponent(JSON.stringify(ob)), daysTTL);
	}

	function writeCookie(name, value, daysTTL){
	//Write cookie by name
		var expires="";
		if(daysTTL){
			var date = new Date();
			date.setTime(date.getTime()+(daysTTL*24*60*60*1000));
			//Or: new Date(yyyy,mm,dd).toUTCString();
			expires = "; expires="+date.toGMTString();
		}
		document.cookie = name+"="+value+expires+"; path=/";
	}

	function readCookie(name){
	//Read cookie by name
		var nameEQ = name + "=",
			cookieArr = document.cookie.split(';');
		for(var i=0;i<cookieArr.length;i++){
			var c = cookieArr[i];
			while(c.charAt(0)==' ')c = c.substring(1,c.length);
			if(c.indexOf(nameEQ)==0)return c.substring(nameEQ.length,c.length);
		}
	}

	function eraseCookie(name){
	//Erase cookie by name
		writeCookie(name,"",-1);
	}

	/*
	   Grid operations
	*/
	function addRow(){
	//Handler for add row button
		if(tempId>99){
			//DB table starts at 100 to allow 99 temp ids
			alert("Please save before continuing!!");
			return;
		}
		var entries = {id:tempId, who:loggedInUser, date_timestamp:getTime(true), time_start:getTime(), status:1};
		data.unshift(entries);
		tempId++;
		grid.update(); //No save until edited
	}

	function duplicateRow(rowIndex){
	//Handler for duplicate row button
		if(tempId>99){
			//DB table starts at 100 to allow 99 temp ids
			alert("Please save before continuing!!");
			return;
		}
		if(confirm("Duplicate row?")){
			var origRow = getDataRow(rowIndex),
				entries = {id:tempId, who:loggedInUser, date_timestamp:getTime(true), time_start:getTime(), description:origRow.description, jobnum:origRow.jobnum, client:origRow.client, contact:origRow.contact, status:1};
			data.unshift(entries); //Prepend to data
			changedRows[tempId]={action:"edit",data:entries}; //Save row as edited
			tempId++;
			grid.update(true);  //Update grid and save to DB (if prefs.autoSave is on)
		}
	}

	function deleteRow(rowIndex){
	//Handler for delete row buttons
		if(confirm("Delete row?")){
			changedRows[getDataRow(rowIndex).id]={action:"remove",data:getDataRow(rowIndex)}; //Save row as removed
			if(prefs.showDeletedRows)getDataRow(rowIndex).status = 0;
			else{
				var dataIndex = grid.View.getIndexById(grid.View.rows[rowIndex].id);
				removeArrayEntry(data,dataIndex,dataIndex);
			}
			grid.update(true); //Update grid and save to DB (if prefs.autoSave is on)
		}
	}

	function restoreRow(rowIndex){
	//Handler for restore row buttons
		if(confirm("Restore row?")){
			getDataRow(rowIndex).status = 1;
			changedRows[getDataRow(rowIndex).id]={action:"edit",data:getDataRow(rowIndex)}; //Save row as edited
			grid.update(true); //Update grid and save to DB (if prefs.autoSave is on)
		}
	}

	function doCellEdit(rowIndex, cellIndex, value){
	//Edit cell programmatically
		grid.Grid.gotoCell(rowIndex, cellIndex, true);
		$('.editor-text').val(value); //Text editor field
		Slick.GlobalEditorLock.commitCurrentEdit();
	}

	function updateTimeStart(rowIndex, cellIndex, value){
		function doUpdate(){
			var currTime = getTime();
			doCellEdit(rowIndex, cellIndex, currTime); //Update cell
		}
		if(value){
			if(confirm("Update "+value+" to current time?"))doUpdate();
		}
		else doUpdate();
	}

	function updateTimeEnd(rowIndex, cellIndex, value){
		function doUpdate(){
			var currTime = getTime(),
				currTimeMins = getTotalMins(currTime),
				startTimeMins = getTotalMins(getDataRow(rowIndex).time_start);

			if(startTimeMins > currTimeMins)alert(currTime + " is before start time!");
			else doCellEdit(rowIndex, cellIndex, currTime); //Update cell
		}
		if(value){
			if(confirm("Update "+value+" to current time?"))doUpdate();
		}
		else doUpdate();
	}

	function getSelectedRowsData(){
		var selData = [],
			selRows = grid.Grid.getSelectedRows();
		for(var i=0;i<selRows.length;i++){
			selData.push(data[selRows[i]]);
		}
		return selData;
	}

	function updateTotalsAndSave(rowIndex){
		var totalMins = calcTotalMins(rowIndex);
		if(totalMins!=null){
			if(totalMins<0){
				alert("End time is before start time!");
				totalMins = 0;
			}
			getDataRow(rowIndex).total_mins = totalMins; //Set time total
		}
		grid.View.calculateTotals(); //Update totals row
		grid.update(true); //Update grid and save to DB (if prefs.autoSave is on)
	}

	function saveData(addCallback){ //Optionally add another callback
	//Save updates to grid
		var debug = false; //Debug - outputs grid data and changes to js console

		if(debug){ //Debug
			console.log("* Grid data before save *");
			console.log(JSON.stringify(data));
			console.log("* Changed rows array *");
			console.log(JSON.stringify(changedRows));
		}
		if(saveData.TO)clearTimeout(saveData.TO);
		$("#saveBtn").html("SAVING...").attr({"style":"background:#6699ff !important"}); //Style attr to override !important

		//Save data
		$.post('includes/timesheet_save.php', {json: JSON.stringify(changedRows)}, function(jsonStr){
			var jsonOb = JSON.parse(jsonStr),
				status = jsonOb.status*1,
				newIds = jsonOb.newIds,
				newIdsCount = 0;

			//See if there were any new rows created
			for(var p in newIds)newIdsCount++;

			//Update any new rows with id from DB
			if(newIdsCount){
				for(var p in data){
					//Much more efficient than looping through data array every time
					var rowId = data[p].id;
					if(newIds[rowId]){
						if(debug)console.log("* Updated temp row id "+rowId+" to DB row id "+newIds[rowId]+" *"); //Debug
						data[p].id = newIds[rowId];
					}
				}
			}

			//Show msg and clear changes if successful save
			if(status){
				changedRows = {}; //Clear stored changes
				$("#saveBtn").html("SAVED");
			}
			else $("#saveBtn").html("NO CHANGES");

			if(debug){ //Debug
				console.log("* Grid data after save *");
				console.log(JSON.stringify(data));
			}
			
			if(saveData.TO)clearTimeout(saveData.TO); //Timeout associated to this function ob
			saveData.TO = setTimeout(function(){
				$("#saveBtn").html("SAVE &raquo;").attr({"style":""});
			},2000);

			//Optional additional callback from arg
			if(typeof addCallback === "function"){
				addCallback();
			}
		});
	}

	/*
	   Export to CSV
	*/
	function initDownloadify(){
		var dt = new Date(),dd = dt.getDate(),mm = dt.getMonth()+1,yyyy = dt.getFullYear(); //January is 0!
		if(dd<10){dd='0'+dd};if(mm<10){mm='0'+mm};
		var dateStr = dd+'_'+mm+'_'+yyyy;

		Downloadify.create('downloadify',{
			filename: "timesheet_"+ dateStr +".csv",
			data: function(){return getCSV()},
			onComplete: function(){},
			onCancel: function(){},
			onError: function(){ alert('No data!'); },
			swf: 'downloadify/media/downloadify.swf',
			downloadImage: 'downloadify/images/download.png',
			width: 100,
			height: 30,
			transparent: true,
			append: false
		});
	}

	function getCSV(){
		var csv = "",
			gridSelRows,
			gridCols = grid.columns,
			currRows = grid.View.rows;
	/* 
		//Get selected rows from grid - not using currently as totals would be wrong
		//Could create a minutes total in csv loop?
		var currRows = getSelectedRowsData();
		if(currRows.length)gridSelRows = currRows; //If user has rows selected
		else{ //No rows selected - get all viewed rows
			alert("Exporting all rows!");
			currRows = grid.View.rows;
		}
	*/
		//Compile gridData
		for(var i=0;i<currRows.length;i++){
			var row = currRows[i],
				colCount = 0;

			//Compile csv string
			//Loop through grid.columns to ensure order is preserved
			for(var j=0;j<gridCols.length;j++){
				var colIdName = gridCols[j].id,
					val = row[colIdName];
				colCount++;
				if(colIdName=="complete" || colIdName=="+" || colIdName=="status"){ //Filter out
					colCount--; 
					continue;
				}
				if(typeof val=="string")val = val.replace('"',"'"); //Replace any quotes that would break CSV format
				if(colIdName=="date_timestamp")val = getFormattedTimestamp(val);
				if(colIdName=="total_mins")val = formatTotalMins(val);
				if(!val)val="-";
				csv += '"' + val + '",'; //Wrap with quotes in case of commas
			}
			csv = csv.substring(0,csv.length-1)+"\r\n"; //Remove last comma
		}

		var totalTime = 0,
			totalsOb = grid.View.calculateTotals();
		if(totalsOb)totalTime = totalsOb.total_mins;
		for(var i=0;i<colCount-2;i++)csv += '"",'; //Add empty cols
		csv += '"TOTAL:","'+totalTime+'"'; //Add total

		return csv;
	}

	/*
	   Add UI methods to namespace
	*/
	Slick.ui = {
		updateTimeStart: updateTimeStart,
		updateTimeEnd: updateTimeEnd,
		duplicateRow: duplicateRow,
		restoreRow: restoreRow,
		deleteRow: deleteRow
	}

})(jQuery, Slick, window, document);