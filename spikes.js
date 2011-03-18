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

// взятие элемента по ID
function ID(id) {return document.all ? document.all[id] : document.getElementById(id);}

// возвращает массив элементов представляющих собой заданный тег. Если родительский элемент
// не указан - берется document
function getTags(tag, refElem) {return (refElem ? refElem : document).getElementsByTagName(tag);}

// возвращает массив элементов имеющих заданный класс. Если родительский элемент не указан -
// берется document
function gcl(className, refElem){
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

// возвращает массив только видимых элементов указанного класса
function gclvis(className, refElem){
	var elems = gcl(className, refElem);
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
	var kids = gcl(className, elem ? elem : null);
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
	do {refNode = refNode.nextSibling;} while (refNode.nodeType != 1);
	return refNode;
}

// возвращает предыдущий элемент (не любую ноду!)
function prevElem(refNode) {
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
	ID('debug2').innerHTML = text;
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
	setCookie(name, null, new Date(0), path, domain);
	return true;
}


function utf8_encode ( str_data ) {	// Encodes an ISO-8859-1 string to UTF-8
	//
	// +   original by: Webtoolkit.info (http://www.webtoolkit.info/)

	str_data = str_data.replace(/\r\n/g,"\n");
	var utftext = "";

	for (var n = 0; n < str_data.length; n++) {
		var c = str_data.charCodeAt(n);
		if (c < 128) {
			utftext += String.fromCharCode(c);
		} else if((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		} else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
	}

	return utftext;
}



function md5 ( str ) {	// Calculate the md5 hash of a string
	//
	// +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
	// + namespaced by: Michael White (http://crestidg.com)

	var RotateLeft = function(lValue, iShiftBits) {
			return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
		};

	var AddUnsigned = function(lX,lY) {
			var lX4,lY4,lX8,lY8,lResult;
			lX8 = (lX & 0x80000000);
			lY8 = (lY & 0x80000000);
			lX4 = (lX & 0x40000000);
			lY4 = (lY & 0x40000000);
			lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
			if (lX4 & lY4) {
				return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
			}
			if (lX4 | lY4) {
				if (lResult & 0x40000000) {
					return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
				} else {
					return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
				}
			} else {
				return (lResult ^ lX8 ^ lY8);
			}
		};

	var F = function(x,y,z) { return (x & y) | ((~x) & z); };
	var G = function(x,y,z) { return (x & z) | (y & (~z)); };
	var H = function(x,y,z) { return (x ^ y ^ z); };
	var I = function(x,y,z) { return (y ^ (x | (~z))); };

	var FF = function(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

	var GG = function(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

	var HH = function(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

	var II = function(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

	var ConvertToWordArray = function(str) {
			var lWordCount;
			var lMessageLength = str.length;
			var lNumberOfWords_temp1=lMessageLength + 8;
			var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
			var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
			var lWordArray=Array(lNumberOfWords-1);
			var lBytePosition = 0;
			var lByteCount = 0;
			while ( lByteCount < lMessageLength ) {
				lWordCount = (lByteCount-(lByteCount % 4))/4;
				lBytePosition = (lByteCount % 4)*8;
				lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount)<<lBytePosition));
				lByteCount++;
			}
			lWordCount = (lByteCount-(lByteCount % 4))/4;
			lBytePosition = (lByteCount % 4)*8;
			lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
			lWordArray[lNumberOfWords-2] = lMessageLength<<3;
			lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
			return lWordArray;
		};

	var WordToHex = function(lValue) {
			var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
			for (lCount = 0;lCount<=3;lCount++) {
				lByte = (lValue>>>(lCount*8)) & 255;
				WordToHexValue_temp = "0" + lByte.toString(16);
				WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
			}
			return WordToHexValue;
		};

	var x=Array();
	var k,AA,BB,CC,DD,a,b,c,d;
	var S11=7, S12=12, S13=17, S14=22;
	var S21=5, S22=9 , S23=14, S24=20;
	var S31=4, S32=11, S33=16, S34=23;
	var S41=6, S42=10, S43=15, S44=21;

	str = this.utf8_encode(str);
	x = ConvertToWordArray(str);
	a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

	for (k=0;k<x.length;k+=16) {
		AA=a; BB=b; CC=c; DD=d;
		a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
		d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
		c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
		b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
		a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
		d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
		c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
		b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
		a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
		d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
		c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
		b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
		a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
		d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
		c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
		b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
		a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
		d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
		c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
		b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
		a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
		d=GG(d,a,b,c,x[k+10],S22,0x2441453);
		c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
		b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
		a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
		d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
		c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
		b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
		a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
		d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
		c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
		b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
		a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
		d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
		c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
		b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
		a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
		d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
		c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
		b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
		a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
		d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
		c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
		b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
		a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
		d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
		c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
		b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
		a=II(a,b,c,d,x[k+0], S41,0xF4292244);
		d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
		c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
		b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
		a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
		d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
		c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
		b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
		a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
		d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
		c=II(c,d,a,b,x[k+6], S43,0xA3014314);
		b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
		a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
		d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
		c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
		b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
		a=AddUnsigned(a,AA);
		b=AddUnsigned(b,BB);
		c=AddUnsigned(c,CC);
		d=AddUnsigned(d,DD);
	}

	var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

	return temp.toLowerCase();
}
