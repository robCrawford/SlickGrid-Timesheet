SlickGrid-Timesheet
===================

Timesheet application using SlickGrid ([andrewchilds fork](https://github.com/andrewchilds/SlickGrid))  
*Still a work in progress* - works fine for users but for example account creation is still manual.

*Features:*  
* Fiter rows by column / multiple column values i.e date, job number, client  
* Export to CSV (uses [downloadify](https://github.com/dcneiner/Downloadify))  
* Optional auto save, auto edit on cell click  
* Cookies for prefs, login with rememberme  
* User / admin level logins (admin sees data from all users)  

###Installation

Run the mySQL queries found in `/_mysql` to create the `sg_timesheet` database.  
Change the connection details found in `/config/settings.php`  

Browse to index.php and log in using the default credentials:  
*username:* 'User' or 'Admin'  
*password:* 'sg_timesheet'  

*To change these details you will currently have to do so manually, as stated above.*  
*If unsure please follow the comments in* `/_mysql`.

###Demo
[Demo here](http://robc.freeiz.com/sg_timesheet/) - feel free to add/edit/delete.