function consoleWrite(string, skip){
	if (skip && !cfg['console_display_all']) return;
	var date = new Date();
	var cons = e('#console');
	var time;

	if (date.toLocaleFormat) {
		time = date.toLocaleFormat('%H:%M:%S');
	} else {

		var t = {};
		t['H'] = date.getHours();
		t['M'] = date.getMinutes();
		t['S'] = date.getSeconds();
		for (var i in t) { if (t[i]*1 < 10) t[i] = '0'+t[i]; }

		time = t['H'] + ':' + t['M'] + ':' + t['S'];
	}

	cons.innerHTML = '<b>'+time+'</b> - '+string+'<br>'+cons.innerHTML;
}

function resizeContArea(column){
	var chromeH = classDimen('h', 'chrome', column);
	editCSS('#'+column.id+' .contents', 'height:'+(mainHeight - chromeH)+'px');
	editCSS('#'+column.id+' .collapser', 'height:'+(mainHeight - chromeH)+'px');
}

// Изменяет высоту элементов, которые должны иметь фиксированную высоту в пикселях
function resizeFrame() {
	var offset = frameWidth() - e('#app_block').offsetWidth;
	editCSS('#curtain', 'height:'+frameHeight()+'px;');
	
	if (frameHeight() <= 600 || frameWidth() <= 1024){
		e('#lowres_css').href = 'skins/'+cfg['skin']+'/desktop_lowres.css';
		// !! затычка. Будет работать толль при условии, что в lowres-версии контур равен 0.
		offset = 0;
	} else {
		e('#lowres_css').href = '';
	}
	
	mainHeight = frameHeight() - offset - e('#debug_console').offsetHeight - e('#top_bar').offsetHeight;
	editCSS('#app_area', 'height:'+mainHeight+'px;'); // главное "окно"

	var cols = e('.global_column');
	for (var i=0; i<cols.length; i++) resizeContArea(cols[i]);
}

function removeCurtain(){
	removeClass(e('#app_area'), 'invis');
}


function callOverlayPage() {
	unhide(e('#curtain'), e('#over_curtain'));
	wait.timeout(cfg['posts_updtimer_blurred'], cfg['topics_updtimer_blurred'], 'lock');
}

function closeOverlayPage() {
	hide(e('#curtain'), e('#over_curtain'));
	wait.timeout(cfg['posts_updtimer_focused'], cfg['topics_updtimer_focused'], 'unlock');
	deleteCookie('message');
}


// Вставляет дополнительные ячейки для изменения размера и скрытия меню
// !! Возможно - унести в пхп (второстепенное)
function insertResizers(){
	var cols = e('<td>', '#app_block_tr', true); // true - с отвязкой

	for (var i=0; i<cols.length; i++) { var col = cols[i];
		
		if (i == cols.length-1) return; // если последняя колонка

		var portName = col.id.replace('viewport_', '');
		var collapser, resizer, width;
		
		insAfter(col, resizer = newel('TD', 'vport_resizer', 'resizer_'+portName));
		resizer.onmousedown = resizeColumn;
		resizer.appendChild(newel('DIV', 'fixer'));

		insBefore(e('@contents', '#viewport_'+portName), collapser = newel('DIV', 'collapser', 'collapser_'+portName));
		collapser.onclick = toggleCollapse;

		if (getCookie(col.id+'_collapsed') == '1') toggleCollapse(portName);
		if ((width = getCookie(col.id+'_width'))) editCSS('#'+col.id, 'width:' + width + '%');
	}
}

function resizeColumn(event){

	// цена процента, вычисляющаяся из ширины рабочей области
	var precCost = (e('#app_block').offsetWidth
		//- classDimen('w', 'vport_resizer', e('#app_block_tr'))
		//- classDimen('w', 'collapsed', e('#app_block_tr'))
		)/100;

	var colL = prevElem(this); // что ресайзить будем
	var initWL = colL.offsetWidth; //начальная ширина колонки в момент клика
	var initMX = getX(event); // начальная позиция мыши по горизонтали

	// по чем будем возить мышкой :)
	var parent = document.documentElement;
	parent.onmousemove = resizeModeOn;
	parent.onmouseup = resizeModeOff;

	// отключаем выделение через CSS (для вебкит)
	addClass(e('#app_area'), 'noselect');

	// минимальная ширина колонки в процентах
	var minW = 1*(compStyle(colL).minWidth.replace('px', '') / precCost).toFixed(2);

	{ // в этом блоке - то что нужно для управления последней колонкой - предотвращение
	  // "неправильного ресайза", которое к сожалению работает не вполне корректно
		var cols = e('.resizeable', colL.parentNode);
		var colLast = cols[cols.length-1];
		var colLastMW = 1*compStyle(colLast).minWidth.replace('px', '');
		var lastChange = 0;
	}

	var newPrec, finalPrec;
	
	function resizeModeOn (event) {
		removeSelection(); // продолжаем отключать выделение (для остальных браузеров)

		newPrec = 1*((initWL + getX(event) - initMX) / precCost).toFixed(2);

		if (newPrec <= minW) {
			finalPrec = minW;
		} else if (colLast.offsetWidth <= colLastMW && lastChange < newPrec) {
			finalPrec = lastChange;
		} else {
			finalPrec = newPrec; // вбиваем ширину
			lastChange = newPrec;
		}

		editCSS('#' + colL.id, 'width:' + finalPrec + '%');
	}

	function resizeModeOff () {
		parent.onmousemove = null;
		parent.onmouseup = null;
		removeClass(e('#app_area'), 'noselect');
		setCookie(colL.id+'_width', finalPrec);
	}
}

function toggleCollapse(portName){
	if (typeof portName != 'string') portName = this.id.replace('collapser_', '');

	addClass(e('#viewport_'+portName), 'collapsed');
	addClass(e('#resizer_'+portName), 'clear');
	e('#viewport_'+portName).style.width = '14px';
	e('#viewport_'+portName).style.minWidth = '14px';

	e('#viewport_'+portName).onmouseup = toggleShow;
	e('#resizer_'+portName).onmousedown = null;

	setCookie('viewport_'+portName+'_collapsed', '1');
}

function toggleShow(){
	var portName = this.id.replace('viewport_', '');

	removeClass(this, 'collapsed');
	removeClass(e('#resizer_'+portName), 'clear');
	e('#viewport_'+portName).removeAttribute('style');

	e('#viewport_'+portName).onmouseup = null;
	e('#resizer_'+portName).onmousedown = resizeColumn;

	// выровнять высоты внутренних элементов
	resizeContArea(this);

	setCookie('viewport_'+portName+'_collapsed', '0');
}

function debugToggle(id){
	var thys = (typeof id == 'string') ? e('#'+id) : this;

	var hideable = e('#debug_console');
	if (hasClass(hideable, 'none')){
		unhide(hideable);
		addClass(thys, 'btn_active');
		resizeFrame();
		setCookie('toggle_debug', '1');
	} else {
		hide(hideable);
		removeClass(thys, 'btn_active');
		resizeFrame();
		setCookie('toggle_debug', '0');
	}
}

function loadTemplate(name, container, cache){

	cache = !cache;

	container.innerHTML = '';
	addClass(container, 'throbber');

	// AJAX:
	JsHttpRequest.query( 'displays/desktop/ajax_template.php', { // аргументы:
		template: name
	}, function(result, html) { // что делаем, когда пришел ответ:
		removeClass(container, 'throbber');
		container.innerHTML = html;
	}, cache ); // не запрещать кеширование
}


function fillToolbars(){

	var topicsBar = e('@toolbar', '#viewport_topics');
	var postsBar = e('@toolbar', '#viewport_posts');

	var addButton = function(name, bar){
		var btn = newel('div', 'left sbtn '+name);
		bar.appendChild(btn);
		btn.innerHTML = '<span>'+txt['btn_'+name]+'</span>';
		return btn;
	}

	var newTopicBtn = addButton('newtopic', postsBar);
	var markRead = addButton('markread', postsBar);

	newTopicBtn.onclick = function(){newTopic(newTopicBtn);}

	markRead.onclick = function(){

		addClass(markRead, 'throbb');

		// AJAX:
		JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

			action: 'mark_read'
			, id: currentTopic

		}, function(result, errors) { // что делаем, когда пришел ответ:

			var unreads = e('.unread', e('@contents', '#viewport_posts'), true); // с отвязкой
			for (var i=0; i<unreads.length; i++) removeClass(unreads[i], 'unread');
			removeClass(markRead, 'throbb');

		}, true ); // запрещать кеширование
	}
}


function attachActions(){

	e('#debug_toggle').onclick = debugToggle;
	if (getCookie('toggle_debug') == '1') debugToggle('debug_toggle');

	e('@close', '#over_curtain').onclick = closeOverlayPage;

	if (e('#regBtn')) e('#regBtn').onclick = function (){
		callOverlayPage();
		e('@title', '#over_curtain').innerHTML = txt['title_register'];
		loadTemplate('regform', e('@contents', '#over_curtain'), false);
	}

	if (e('#loginBtn')) e('#loginBtn').onclick = function(){
		var form = e('#loginForm');
		form.lochash.value = location.hash;
		form.submit();
	}

	if (e('#logoutBtn')) e('#logoutBtn').onclick = function(){
		var form = e('#loginForm');
		form.lochash.value = location.hash;
		form.submit();
	}

}


// функция для использования в общей onload-функции
function startInterface(){
	addDynamicCSS();
	insertResizers();
	resizeFrame();

	attachActions();

	fillToolbars();
}

window.onresize = resizeFrame;

/*
function test(id) {
	var theOne = e('#'+id);
	theOne.style.visibility = "visible";
    theOne.style.opacity = 0;
    setTimeout(function() {
        //theOne.style.WebkitTransition = "all 0.5s ease-in-out";
		theOne.style.transition = "all 0.5s ease-in-out";
        theOne.style.opacity = 1;
    }, 0);
}
*/
