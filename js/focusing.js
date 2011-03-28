function WinFocus(){

	var foc = this;
	this.on = false;

	//!! придумать более совершенную систему фокусировки. Сейчас событие по наведению отрабатывает не 
	//совсем точно - если окно неактивно, после наведения на него фокус приобретается, но после убирания
	//мыши - не теряется и потом тоже иногда не теряется даже при полной расфокусировке окна

	var focusOn = function(params) { if (!foc.on) {
		foc.on = true;
		console('window focused');
		focusDoc(params);
	}}

	var focusOff = function(params){ if (foc.on) {
		foc.on = false;
		console('window blurred');
		blurDoc(params);
	}}

	if (is_ie) {
		document.onfocusin = focusOn;
		document.onfocusout = focusOff;
	} else {
		window.onfocus = focusOn;
		window.onblur = focusOff;
	}
	
	document.onmouseover = function(){ if (foc.on == false){
		//console('(focus on hover, `cause foc.on was '+foc.on);
		focusOn();
		//console('focused, now foc.on is '+foc.on);
	}}
	
	document.onmouseout = function(){ if (foc.on == false){
		//console('(blur on hover, `cause foc.on was '+foc.on);
		focusOff();
		//console('blurred, now foc.on is '+foc.on);
	}}
	
}

focus = new WinFocus;


