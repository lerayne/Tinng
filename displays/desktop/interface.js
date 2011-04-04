// обертки для учета ширины бортика
function innerFrameHeight() {return frameHeight() - (mainOffset*2);}
function innerFrameWidth() {return frameWidth() - (mainOffset*2);}

function resizeContArea(column){
	var chromeH = classDimen('h', 'chrome', column);
	editCSS('#'+column.id+' .content', 'height:'+(mainHeight - chromeH)+'px');
	editCSS('#'+column.id+' .collapser', 'height:'+(mainHeight - chromeH)+'px');
}

function console(string, skip){
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

// Изменяет высоту элементов, которые должны иметь фиксированную высоту в пикселях
function resizeFrame() {
	editCSS('#curtain', 'height:'+frameHeight()+'px;');
	mainHeight = innerFrameHeight() - e('#debug_depo').offsetHeight - e('#main_menu').offsetHeight;
	editCSS('#main', 'height:'+mainHeight+'px;'); // главное "окно"

	var cols = e('.global_column');
	for (var i=0; i<cols.length; i++) {resizeContArea(cols[i]);}
}

function removeCurtain(){
	removeClass(e('#main'), 'invis');
}


function callOverlayPage() {
	unhide(e('#curtain'), e('#overdiv'));
	wait.timeout(cfg['posts_updtimer_blurred'], 'lock');
}

function closeOverlayPage() {
	hide(e('#curtain'), e('#overdiv'));
	wait.timeout(cfg['posts_updtimer_focused'], 'unlock');
	deleteCookie('message');
}


// Вставляет дополнительные ячейки для изменения размера и скрытия меню
// !! Возможно - унести в пхп (второстепенное)
function insertResizers(){
	var type = 'TD';
	var cols = childElems(e('#app_frame_tr'), type);
	var col;
	for (var i=0; i<cols.length; i++) {col = cols[i];

		var width;
		if (i != cols.length - 1) { // если не последняя колонка
			var collapser, resizer;
			insAfter(col, resizer = newel(type, 'col_resizer', 'resizer_'+i));
			resizer.onmousedown = resizeColumn;
			resizer.appendChild(newel('DIV', 'fixer'));

			insBefore(e('#content_'+i), collapser = newel('DIV', 'collapser', 'collapser_'+i));
			collapser.onclick = toggleCollapse;
			
			if (getCookie('col_'+i+'_collapsed') == '1') toggleCollapse(collapser.id);
			if ((width = getCookie('col_'+i+'_width'))) editCSS('#col_'+i, 'width:' + width + '%');
		}
	}
}

function resizeColumn(event){

	// цена процента, вычисляющаяся из ширины рабочей области
	var precCost = (innerFrameWidth()
		//- classDimen('w', 'col_resizer', e('#app_frame_tr'))
		//- classDimen('w', 'collapsed', e('#app_frame_tr'))
		)/100;

	var colL = prevElem(this); // что ресайзить будем
	var initWL = colL.offsetWidth; //начальная ширина колонки в момент клика
	var initMX = getX(event); // начальная позиция мыши по горизонтали

	// по чем будем возить мышкой :)
	var parent = document.documentElement;
	parent.onmousemove = resizeModeOn;
	parent.onmouseup = resizeModeOff;

	// отключаем выделение через CSS (для вебкит)
	addClass(e('#main'), 'noselect');

	// минимальная ширина колонки в процентах
	var minW = 1*(compStyle(colL).minWidth.replace('px', '') / precCost).toFixed(2);

	{ // в этом блоке - то что нужно для управления последней колонкой - предотвращение
	  // "неправильного ресайза", которое к сожалению работает не вполне корректно
		var cols = childElems(colL.parentNode, null, 'resizeable');
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
		removeClass(e('#main'), 'noselect');
		setCookie(colL.id+'_width', finalPrec);
	}
}

function toggleCollapse(id){
	var collapser = (typeof id == 'string') ? e('#'+id) : this;

	var i = collapser.id.replace('collapser_', '');

	addClass(e('#col_'+i), 'collapsed');
	addClass(e('#resizer_'+i), 'clear');
	e('#col_'+i).style.width = '14px';
	e('#col_'+i).style.minWidth = '14px';

	e('#col_'+i).onmouseup = toggleShow;
	e('#resizer_'+i).onmousedown = null;

	setCookie('col_'+i+'_collapsed', '1');
}

function toggleShow(){
	var i = this.id.replace('col_', '');

	removeClass(this, 'collapsed');
	removeClass(e('#resizer_'+i), 'clear');
	e('#col_'+i).removeAttribute('style');

	e('#col_'+i).onmouseup = null;
	e('#resizer_'+i).onmousedown = resizeColumn;

	// выровнять высоты внутренних элементов
	resizeContArea(this);

	setCookie('col_'+i+'_collapsed', '0');
}

function debugToggle(id){
	var thys = (typeof id == 'string') ? e('#'+id) : this;

	var hideable = e('#debug_depo');
	if (ifClass(hideable, 'none')){
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

// функция для использования в общей onload-функции
function startInterface(){
	addDynamicCSS();
	insertResizers();
	resizeFrame();
	e('#debug_toggle').onclick = debugToggle;
	if (getCookie('toggle_debug') == '1') debugToggle('debug_toggle');

	e('#content_0').appendChild(newel('div', null, 'test'));
	editCSS('#test', 'width:50px; height:50px; background-color:black');

	e('@close', '#overdiv').onclick = closeOverlayPage;

	if (e('#regBtn')) e('#regBtn').onclick = function (){
		callOverlayPage();
		e('@title', '#overdiv').innerHTML = txt['title_register'];
		loadTemplate('regform', e('@overcontent', '#overdiv'), false);
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
