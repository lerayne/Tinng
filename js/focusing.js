function WinFocus(){

	var focus = this;
	this.on = false;

	var focusOn = function(params) {
		this.on = true;
		focusDoc(params);
	}

	var focusOff = function(params){
		this.on = false;
		blurDoc(params);
	}

	if (is_ie) {
		document.onfocusin = focusOn;
		document.onfocusout = focusOff;
	} else {
		window.onfocus = focusOn;
		window.onblur = focusOff;
	}

	document.onmouseover = function(){ if (focus.on == false){
		focusOn(focus.on);
	}}

	document.onmouseout = function(){ if (focus.on == false){
		focusOff(focus.on);
	}}
}

focus = new WinFocus;


