<script>

//var n
//webkitNotifications
//n = window.webkitNotifications.createNotification('', 'Notify me', 'This is the notification body');

function setNotification() {
	var n
	
	//webkitNotifications
	if (window.webkitNotifications.checkPermission() != 0) {
		alert('please allow notifications by clicking that link');

		document.getElementById('allowNotificationLink').style.backgroundColor = 'Red';
		return 0;
	}
	
	n = window.webkitNotifications.createNotification('http://www.210computing.com/favicon.ico', 'Notification title', 'Notification body');
	
	n.show();
}

//requestPermission(in Function callback)
function setAllowNotification() {
	window.webkitNotifications.requestPermission(functionToCallWhenPermissionGranted);
}

function functionToCallWhenPermissionGranted() {

	//alert('permission is' + window.webkitNotifications.checkPermission());
	if (window.webkitNotifications.checkPermission() == 0)
		setNotification();
}


</script>

<?php
#phpinfo();
#$a = strtotime('2011-03-19 23:21:00').'000';
#echo substr($a, 0, strlen($a)-3);

mail('lerayne@gmail.com', 'php mail test', 'test');

?>