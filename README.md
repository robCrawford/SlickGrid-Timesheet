SlickGrid-Timesheet
===================

Timesheet application using SlickGrid ([andrewchilds fork](https://github.com/andrewchilds/SlickGrid))  
*Work in progress* - Complete for users, but account creation is currently manual.

*Features:*  
* Fiter rows by column / multiple columns i.e date, job number, client  
* Export to CSV (uses [downloadify](https://github.com/dcneiner/Downloadify))  
* Optional auto save, auto cell edit on click  
* Cookies for prefs and login  
* User / admin level logins (admin view shows data from all users)  

###Installation

Run the mySQL queries found in `/_mysql` to create the `sg_timesheet` database.  
Change the connection details found in `/config/settings.php`  

Browse to index.php and log in using the default credentials:  
*username:* 'User' for individual timesheet view or 'Admin' for all entries  
*password:* 'sg_timesheet'  

*To change these details you will currently have to do so manually, as stated above.*  
*If unsure please follow the comments in* `/_mysql`.

###Demo
[Demo here (static)](http://gdriv.es/timesheet) - *note that login and save are disabled.*
