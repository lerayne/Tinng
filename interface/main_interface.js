// обертки для учета ширины бортика
function innerFrameHeight() {return frameHeight() - (mainOffset*2);}
function innerFrameWidth() {return frameWidth() - (mainOffset*2);}

function resizeContArea(column){
	var chromeH = classDimen('h', 'chrome', column);
	editCSS('#'+column.id+' .content', 'height:'+(mainHeight - chromeH)+'px');
	editCSS('#'+column.id+' .collapser', 'height:'+(mainHeight - chromeH)+'px');
}

// Изменяет высоту элементов, которые должны иметь фиксированную высоту в пикселях
function resizeFrame() {
	mainHeight = innerFrameHeight() - ID('debug_depo').offsetHeight - ID('main_menu').offsetHeight;
	editCSS('#main', 'height:'+mainHeight+'px;'); // главное "окно"

	var cols = gcl('global_column');
	for (var i=0; i<cols.length; i++) {resizeContArea(cols[i]);}
}

function removeCurtain(){
	removeClass(ID('main'), 'invis');
}


// Вставляет дополнительные ячейки для изменения размера и скрытия меню
// !! Возможно - унести в пхп (второстепенное)
function insertResizers(){
	var type = 'TD';
	var cols = childElems(ID('app_frame_tr'), type);
	var col;
	for (var i=0; i<cols.length; i++) {col = cols[i];

		var width;
		if (i != cols.length - 1) { // если не последняя колонка
			var collapser, resizer;
			insAfter(col, resizer = newel(type, 'col_resizer', 'resizer_'+i));
			resizer.onmousedown = resizeColumn;
			resizer.appendChild(newel('DIV', 'fixer'));

			insBefore(ID('content_'+i), collapser = newel('DIV', 'collapser', 'collapser_'+i));
			collapser.onclick = toggleCollapse;
			
			if (getCookie('col_'+i+'_collapsed') == '1') toggleCollapse(collapser.id);
			if ((width = getCookie('col_'+i+'_width'))) editCSS('#col_'+i, 'width:' + width + '%');
		}
	}
}

function resizeColumn(event){

	// цена процента, вычисляющаяся из ширины рабочей области
	var precCost = (innerFrameWidth()
		//- classDimen('w', 'col_resizer', ID('app_frame_tr'))
		//- classDimen('w', 'collapsed', ID('app_frame_tr'))
		)/100;

	var colL = prevElem(this); // что ресайзить будем
	var initWL = colL.offsetWidth; //начальная ширина колонки в момент клика
	var initMX = getX(event); // начальная позиция мыши по горизонтали

	// по чем будем возить мышкой :)
	var parent = document.documentElement;
	parent.onmousemove = resizeModeOn;
	parent.onmouseup = resizeModeOff;

	// отключаем выделение через CSS (для вебкит)
	addClass(ID('main'), 'noselect');

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
		removeClass(ID('main'), 'noselect');
		setCookie(colL.id+'_width', finalPrec);
	}
}

function toggleCollapse(id){
	var collapser = (typeof id == 'string') ? ID(id) : this;

	var i = collapser.id.replace('collapser_', '');

	addClass(ID('col_'+i), 'collapsed');
	addClass(ID('resizer_'+i), 'clear');
	ID('col_'+i).style.width = '14px';
	ID('col_'+i).style.minWidth = '14px';

	ID('col_'+i).onmouseup = toggleShow;
	ID('resizer_'+i).onmousedown = null;

	setCookie('col_'+i+'_collapsed', '1');
}

function toggleShow(){
	var i = this.id.replace('col_', '');

	removeClass(this, 'collapsed');
	removeClass(ID('resizer_'+i), 'clear');
	ID('col_'+i).removeAttribute('style');

	ID('col_'+i).onmouseup = null;
	ID('resizer_'+i).onmousedown = resizeColumn;

	// выровнять высоты внутренних элементов
	resizeContArea(this);

	setCookie('col_'+i+'_collapsed', '0');
}

function debugToggle(id){
	var thys = (typeof id == 'string') ? ID(id) : this;

	var hideable = ID('debug_depo');
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

// функция для использования в общей onliad-функции
function startInterface(){
	addDynamicCSS();
	insertResizers();
	resizeFrame();
	ID('debug_toggle').onclick = debugToggle;
	if (getCookie('toggle_debug') == '1') debugToggle('debug_toggle');

	/*
	var nwbtn = newel('div', 'sbtn');
	nwbtn.onclick = function(){
		var req = new JsHttpRequest();
		// что происходит после получения ответа (responseJS)
		req.onreadystatechange = function() {if (req.readyState == 4) {

			ID('debug').innerHTML = 'yesss!';

		}}
		req.open(null, 'engine.php', true);
		req.send({
			action: 'stop_waiting'
		});
	}
	gcl('col_menubar', ID('col_0'))[0].appendChild(nwbtn);*/
}

window.onresize = resizeFrame;

/*
function test(id) {
	var theOne = ID(id);
	theOne.style.visibility = "visible";
    theOne.style.opacity = 0;
    setTimeout(function() {
        //theOne.style.WebkitTransition = "all 0.5s ease-in-out";
		theOne.style.transition = "all 0.5s ease-in-out";
        theOne.style.opacity = 1;
    }, 0);
}
*/
