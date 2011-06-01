window.onload = function(){
	startInterface();
	startEngine();
	removeCurtain();
}

window.onbeforeunload = function(){
	wait.stop();
}
