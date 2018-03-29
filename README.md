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

### Installation

Use `/_mysql/sg_timesheet.sql` to create the `sg_timesheet` database i.e.  
`mysql -u username -p < ~/path/to/_mysql/sg_timesheet.sql`  
(or paste the contents into the SQL tab of phpMyAdmin).  

Rename `/config/settings.php.sample` to `/config/settings.php` and edit the connection details.  

Browse to index.php and log in using the default credentials:  
*username:* 'User' for individual timesheet view or 'Admin' for all entries  
*password:* 'sg_timesheet'  

*To change these details you will currently have to do so manually, as stated above.*  
*If unsure please follow the comments in* `/_mysql`.

### Demo
[Demo here (static)](http://robcrawford.github.io/demos/slickgrid-timesheet-static-demo/) - *note that login and save are disabled.*
