/* набор универсальных функций, облегчающих работу и/или обеспечивающих кроссбраузерность. */

d = new Date;
before = d.getTime();

function finalizeTime(before){
	var b = new Date;
	return (b.getTime()-before);
}

var ua = navigator.userAgent.toLowerCase();

var is_opera = ua.indexOf('opera') != -1;

var is_ff = (ua.indexOf('firefox') != -1 || ua.indexOf('iceweasel') != -1 
	|| ua.indexOf('icecat') != -1) && !is_opera;
var is_gecko = ua.indexOf('gecko') != -1 && !is_opera;

var is_chrome = ua.indexOf('chrome') != -1;
var is_safari = ua.indexOf('applewebkit') != -1 && !is_chrome;
var is_webkit = ua.indexOf('applewebkit') != -1;

var is_ie = ua.indexOf('msie') != -1 && !is_opera;
var is_ie6 = is_ie && ua.indexOf('msie 6') != -1;
var is_ie7 = is_ie && ua.indexOf('msie 7') != -1;
var is_ie8 = is_ie && ua.indexOf('msie 8') != -1;
var is_ie9 = is_ie && ua.indexOf('msie 9') != -1;

var is_phone = ua.indexOf('iphone') != -1 || ua.indexOf('ipod') != -1;


function sql2stamp(str){
	var str1 = str.split(' ');
	var dates = str1[0].split('-');
	var times = str1[1].split(':');
	return new Date(dates[0], dates[1]-1, dates[2], times[0], times[1], times[2]).getTime();
}

function stamp2sql(str){
	var date = new Date(str);

	if (date.toLocaleFormat) {
		return date.toLocaleFormat('%Y-%m-%d %H:%M:%S');
	} else {
		var t = {};
		var y = date.getFullYear();
		t['m'] = date.getMonth()+1;
		t['d'] = date.getDate();
		t['H'] = date.getHours();
		t['M'] = date.getMinutes();
		t['S'] = date.getSeconds();
		for (var i in t) {if (t[i]*1 < 10) t[i] = '0'+t[i];}

		return y + '-' + t['m'] + '-' + t['d'] + ' ' + t['H'] + ':' + t['M'] + ':' + t['S'];
	}
}

// возвращает количество секунд (с дробной частью), прошедших с момента date
function getTimeDiff(date){
	var date2 = new Date();
	var diff = new Date(date2 - date);
	var ms = diff.getMilliseconds();
	if (ms*1 < 10) ms = '0'+ms;
	if (ms*1 < 100) ms = '0'+ms;
	return diff.getSeconds()+'.'+ms;
}


// ФУНКЦИИ ГЛОБАЛЬНЫХ ОБЪЕКТОВ

// взятие высоты рабочей области браузера
function frameHeight(){
	return document.documentElement.clientHeight ?
		document.documentElement.clientHeight : false;
}

// взятие ширины рабочей области браузера
function frameWidth(){
	return document.documentElement.clientWidth ?
		document.documentElement.clientWidth : false;
}

// Функции мыши:
function getX(event) {return (window.event ? window.event : event).clientX;}

function getY(event) {return (window.event ? window.event : event).clientY;}

// не дает выделять элементы по движению мышкой. Использовать во всех событиях onmousemove, где
// выделение нежелательно
function removeSelection(){
    if (window.getSelection) {window.getSelection().removeAllRanges();}
    else if (document.selection && document.selection.clear)
	document.selection.clear();
}



// ТЕКСТОВЫЕ ФУНКЦИИ:

// обрезание пробелов
function trim(s) {return rtrim(ltrim(s));}

function ltrim(s) {return s.replace(/^\s+/, '');}

function rtrim(s) {return s.replace(/\s+$/, '');}



// ОБЕРТКИ DOM (чтение):

// возвращает массив только видимых элементов указанного класса
// !! не используется
function gclvis(className, refElem){
	var elems = e('.'+className, refElem);
	var vis = [];
	for (var i=0, j=0; i<elems.length; i++) if (elems[i].offsetHeight > 0){
		vis[j] = elems[i];
		j++;
	}
	return vis;
}

// выдает одно из изменений (например, суммарную высоту) всех интерфейсных элементов,
// имеющих определенный класс внутри document, или заданного элемента
function classDimen(dim, className, elem) {
	var ret = 0;
	var kids = e('.'+className, elem ? elem : null);
	for (var i=0; i<kids.length; i++){
		if (dim == 'h'){
			ret += kids[i].offsetHeight;
		} else if (dim == 'w'){
			ret += kids[i].offsetWidth;
		}
	}
	return ret;
}

// возвращает массив дочерних узлов (по ID), являющихся элементами,
// причем тег и класс можно указать
function childElems(refNode, certainTag, certainClass){
	var ret = [];
	var j = 0;
	var ns = refNode.childNodes;
	var myclass = new RegExp('\\b'+certainClass+'\\b');
	for (var i=0; i<ns.length; i++){
		if (
			ns[i].nodeType == 1
			&& (ns[i].nodeName == certainTag || !certainTag)
			&& (myclass.test(ns[i].className) || !certainClass)
		){
			ret[j] = ns[i];
			j++;
		}
	}
	return ret;
}

// возвращает следующий элемент (не любую ноду!)
function nextElem(refNode) {
	if (refNode.nextSibling == null) return false;
	do {refNode = refNode.nextSibling;} while (refNode.nodeType != 1);
	return refNode;
}

// возвращает предыдущий элемент (не любую ноду!)
function prevElem(refNode) {
	if (refNode.previousSibling == null) return false;
	do {refNode = refNode.previousSibling;} while (refNode.nodeType != 1);
	return refNode;
}


// ОБЕРТКИ DOM (запись):

// создание нового элемента с заданием класса и ИД
function newel (tag, className, id, content){
	var elem = document.createElement(tag);
	if (className) elem.className = className;
	if (id) elem.id = id;
	if (content) elem.innerHTML = content;
	return elem;
}

// обертка вставки нового элемента перед текущим
function insBefore (refNode, newNode){
	refNode.parentNode.insertBefore(newNode, refNode);
	return newNode;
}

// обертка вставки нового элемента после текущего
function insAfter (refNode, newNode){
	if(refNode.nextSibling) {
		refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
	} else {
		refNode.parentNode.appendChild(newNode);
	}
	return newNode;
}

// удаление элемента
function remove(elem){
	elem.parentNode.removeChild(elem);
}

// полное уничтожение объекта с освобождением памяти
// !! не работает
function destroy(elem){
	var children = elem.childNodes;
	var parent = elem.parentNode;

	for (var i=0; 0<children.length; i++){
		alert(children[i].className+' '+children[i].nodeName);
		elem.removeChild(children[i]);
		if (children[i].hasChildNodes()) destroy(children[i]);
		children[i] = null;
	}
	parent.removeChild(elem);
	elem = null;
}

// Добавляет к элементу указанному в первом аргументе дочерние элементы всех остальных аргументов
function appendKids(){
	var args = appendKids.arguments;
	var parent = args[0];

	for (var i=1; i<args.length; i++){
		if (args[i] && args[i].nodeType == 1) parent.appendChild(args[i]);
	}

	return parent;
}



// ФУНКЦИИ CSS:

// проверка класса
function ifClass(elem, className){
	var exp = new RegExp ('\\b'+className+'\\b');
	return exp.test(elem.className);
}

// выдача скомпилированного стиля элемента
function compStyle(el) {
    return document.defaultView ? document.defaultView.getComputedStyle(el, null) : el.currentStyle;
}

// добавление класса к элементу
function addClass (elem, className) {
	elem.className += ((elem.className.length == 0) ? '' : ' ')+className;
}

// изьятие класса из элемента
function removeClass (elem, className) {
	// !! Сделать убирание классов через регекспы (второстепенное)
	elem.className = elem.className.replace(' '+className, '');
	elem.className = elem.className.replace(className, '');
	if (elem.className.length == 0) elem.removeAttribute('class');
}

// обертки скрытия и отмены скрытия
function hide() {
	var args = hide.arguments;
	for(var i=0; i<args.length; i++){
		addClass(args[i], 'none');
	}
}

function unhide() {
	var args = unhide.arguments;
	for(var i=0; i<args.length; i++){
		removeClass(args[i], 'none');
	}
}

// добавление правила к листу стилей
function addRule(sheet, selector, attributes, index){
	if (sheet.addRule) sheet.addRule(selector, attributes, index);
	if (sheet.insertRule) sheet.insertRule(selector+'{'+attributes+'}', index);
}

// удаление правила из листа по номеру
function deleteRule(sheet, index){
	if (sheet.deleteRule) sheet.deleteRule(index);
	if (sheet.removeRule) sheet.removeRule(index);
}

// возвращает коллекцию правил листа (кроссбраузерность)
function rulesColl(sheet) {return sheet.cssRules ? sheet.cssRules : sheet.rules;}

// добавляет динамический лист стилей (использование данной функции по body onload
// обязательно для корректной работы функции editCSS)
function addDynamicCSS(){
	var dynCSS = document.createElement('STYLE');
	document.getElementsByTagName('HEAD')[0].appendChild(dynCSS);
	dynCSS.title = 'dynamicCSS';

	var sheets = document.styleSheets;
	for (var i=sheets.length-1; i>=0; i--){
		if (sheets[i].title == 'dynamicCSS') {
			dynamicCSS = sheets[i];
			break;
		}
	}

	// на всякий случай дублируем универсальное правило скрытия по классу для
	// корректной работы функций hide и unhide
	addRule(dynamicCSS, '.none', 'display:none', rulesColl(dynamicCSS).length);
	addRule(dynamicCSS, '.clearboth', 'clear:both', rulesColl(dynamicCSS).length);
}

// редавтирует правило в виртуальном листе стилей. Переписывает существующее правило с тем же
// селектором, чем гарантирует отсутствие избыточности и накопления лишних правил
function editCSS (selector, rules){
	var cssRules = rulesColl(dynamicCSS);
	if (cssRules.length > 0) {
		var rule, gsel;
		for (var i=0; i<cssRules.length; i++) {rule = cssRules[i];

			if (rule.selectorText){
				gsel = trim(rule.selectorText);
			} else {
				rule.cssText.match(/^([^{]+)\{(.*)\}\s*$/);
				gsel = trim(RegExp.$1);
			}

			if (selector == gsel) deleteRule(dynamicCSS, i);
		}
	}
	if (rules) addRule(dynamicCSS, selector, rules, rulesColl(dynamicCSS).length);

	// дебаг
	var newRules = rulesColl(dynamicCSS);
	var text='';
	for (var j=newRules.length-1; j>=0; j--) text += newRules[j].cssText+"<br>";
	e('#debug2').innerHTML = text;
}

/*
function addHandler(refElem, event, functionName){
	if (refElem.addEventListener){
		refElem.addEventListener(event, functionName, false);
	} else if (refElem.attachEvent){
		refElem.attachEvent('on'+event, functionName);
	}
}

function removeHandler (refElem, event, functionName){
	if (refElem.removeEventListener){
		refElem.removeEventListener(event, functionName, false);
	} else if (refElem.detachEvent){
		refElem.detachEvent('on'+event, functionName);
	}
}

function preventSelection(element){
  var preventSelection = false;

  function removeSelection(){
    if (window.getSelection) { window.getSelection().removeAllRanges(); }
    else if (document.selection && document.selection.clear)
      document.selection.clear();
  }

  function stopselect_onMouseDown (event) {
	var event = event || window.event;
    var sender = event.target || event.srcElement;
    preventSelection = !sender.tagName.match(/INPUT|TEXTAREA/i);
  }

  function stopselect_onMouseMove (event) {
	 if(preventSelection)
      removeSelection();
  }

  // не даем выделять текст мышкой
  addHandler(element, 'mousemove', stopselect_onMouseMove);
  addHandler(element, 'mousedown', stopselect_onMouseDown);
  addHandler(element, 'mouseup', function(event){
	  removeHandler(element, 'mousemove', stopselect_onMouseMove);
	  removeHandler(element, 'mousedown', stopselect_onMouseDown);
  });

  // борем dblclick
  // если вешать функцию не на событие dblclick, можно избежать
  // временное выделение текста в некоторых браузерах
  /*addHandler(element, 'mouseup', function(){
    if (preventSelection)
      removeSelection();
    preventSelection = false;
  });

function killCtrlA(event){
    var event = event || window.event;
    var sender = event.target || event.srcElement;

    if (sender.tagName.match(/INPUT|TEXTAREA/i))
      return;

    var key = event.keyCode || event.which;
    if (event.ctrlKey && key == 'A'.charCodeAt(0))  // 'A'.charCodeAt(0) можно заменить на 65
    {
      removeSelection();

      if (event.preventDefault)
        event.preventDefault();
      else
        event.returnValue = false;
    }
  }


  // борем ctrl+A
  // скорей всего это и не надо, к тому же есть подозрение
  // что в случае все же такой необходимости функцию нужно
  // вешать один раз и на document, а не на элемент
  //addHandler(element, 'keydown', killCtrlA);
  //addHandler(element, 'keyup', killCtrlA);
}
*/


function setCookie(name, value, expires, path, domain, secure) {
	if (!name || !value) return false;
	var str = name + '=' + encodeURIComponent(value);

	if (expires) str += '; expires=' + expires.toUTCString();
	if (path)    str += '; path=' + path;
	if (domain)  str += '; domain=' + domain;
	if (secure)  str += '; secure';

	document.cookie = str;
	return true;
}

function getCookie(name) {
	var pattern = "(?:; )?" + name + "=([^;]*);?";
	var regexp  = new RegExp(pattern);

	if (regexp.test(document.cookie))
	return decodeURIComponent(RegExp["$1"]);

	return false;
}

function deleteCookie(name, path, domain) {
	if (!name) return false;
	var str = name + '=0';

	str += '; expires=' + new Date().toUTCString();
	if (path)    str += '; path=' + path;
	if (domain)  str += '; domain=' + domain;

	document.cookie = str;
	return true;
}


/* свой велосипед вместо jquery :)
 *
 * в каждый из двух параметров можно передавать либо объект, либо строку вида:
 * '#ref' - возвращает уникальный элемент, найденный по ID
 * '.ref' - возвращает массив элементов, найденных по классу
 * '@ref' - возвращает первый элемент, найденный по классу
 * '<ref>' - возвращает массив элементов, найденных по тегу
 * '[ref]' - возвращает первый элемент, найденный по тегу
 *
 * Функция возвращает ссылку на объект refa находящийся внутри объекта refb, а если refb не
 * задан - внтури document. Указание refb имеет смысл, когда refa - тег или класс, а refb -
 * конкртеный известный элемент, например e('#col_1') вернет объект с этим ID, e('@titlebar', '#col_1')
 * вернет ссылку на первый объект с классом titlebar, из тех что находятся в элементе с ID col_1,
 * а e('<div>', '#col_1') вернет массив всех div-ов находящихся внутри него.
 */
function e(refa, refb){

	var object;

	// возвращает массив элементов имеющих заданный класс. Если родительский элемент не указан -
	// берется document
	var gcl = function (className, refElem){
		if (document.getElementsByClassName){
			return (refElem ? refElem : document).getElementsByClassName(className);
		} else { //реализация для IE
			var retnode = [];
			var myclass = new RegExp('\\b'+className+'\\b');
			var elem = (refElem ? refElem : document).getElementsByTagName('*');
			for (var i = 0; i < elem.length; i++) {
				var classes = elem[i].className;
				if (myclass.test(classes)) {
					retnode.push(elem[i]);
				}
			}
			return retnode;
		}
	}

	if (refb) refb = e(refb); // рекурсия: второй параметр можно указывать так же как первый
	if (typeof refb != 'object') refb = null; // второй параметр должен быть указателем на один элемент

	if (typeof refa == 'object') {

		object = refa; // если передан html-объект - возвращаем его сразу.

	} else { // иначе разбираем строку

		var handle = refa.charAt(0);
		var name = refa.substr(1);

		switch (handle){

			case '#': // берем элемент по ID
				object = document.all ? document.all[name] : document.getElementById(name);
			break;

			case '.': // берем массив по классу
				object = gcl(name, refb);
			break;

			case '@': // берем первый элемент по классу
				object = gcl(name, refb)[0];
			break;

			case '<': // берем массив по тегу
				name = refa.substr(1, name.length-2).toLowerCase();
				object = (refb ? refb : document).getElementsByTagName(name);
			break;

			case '[': // берем первый элемент по тегу
				name = refa.substr(1, name.length-2).toLowerCase();
				object = (refb ? refb : document).getElementsByTagName(name)[0];
			break;
		}
	}
	/*
	this.hide = function(){
		return addClass(object, 'none');
	}

	this.unhide = function(){
		return removeClass(object, 'none');
	}
	*/
	return object;
}

// !! почему не работает?
function f(refa){

	var object = e(refa);


	this.hide = function(){
		addClass(object, 'none');
	}

	this.unhide = function(){
		removeClass(object, 'none');
	}
}

