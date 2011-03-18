// Глобальные переменные
var currentTopic, maxPostId;

// Универсальный класс ветки
function Branch (contArea, topicID, parentID) {
	if (!parentID) parentID = topicID;

	document.onkeypress = null;

	this.e = contArea;
	this.id = this.e.id;
	this.html = this.e.innerHTML;
	this.colNum = this.id.replace('content_','');

	this.appChild = function(node){
		this.e.appendChild(node);
	}

	this.sethtml = function(content){
		this.e.innerHTML = content;
		return this.e.innerHTML;
	}

	// чтобы this функций не забивал this объекта
	var branch = this;

	//contArea.innerHTML = '';
	this.branchCont = newel('div', null, 'branch_'+parentID);
	this.e.appendChild(this.branchCont);


	// создает новый экземпляр визивига с указанными параметрами
	var veditor = function (){
		var editor = new nicEditor({
			buttonList:[
				'bold','italic','underline','strikethrough',
				'left','center','right','justify',
				'indent','outdent',
				//'forecolor',
				'ol','ul',
				'subscript','superscript',
				//'link','unlink','image',
				'hr',
				//'fontFormat',
				'removeformat'
				//,'xhtml'
			],
			xhtml:true,
			externalCSS: 'interface/nicedit.css',
			iconsPath : 'lib_modified/nicEditorIcons.gif'
		});
		return editor;
	}

	/* вешаем кнопки клавиатуры
	document.onkeypress = function(event){
		var evt = event || window.event;
		var key = event.keyCode || event.which;
		col.scrollTop = col.scrollHeight;

		// срабатывать по alt+enter или ctrl+enter
		if ((evt.ctrlKey || evt.altKey) && key == 13){
			sendPost();
		}
	}*/

	// вставляет новый блок сообщения, заполняя его данными из content
	this.createBlock = function(row){
		var type = (topicID == '0') ? 'topic' : 'post';

		// редактирование полей записи через ajax. Аргументы подавать в виде:
		// (['field', containerObject], ['field', containerObject],...)
		var editFields = function (){

			var args = editFields.arguments;
			var jsonArgs = [];

			for (var i=0; i<args.length; i++){
				jsonArgs[i] = {};
				jsonArgs[i]['field'] = args[i][0];
				jsonArgs[i]['data'] = args[i][1].innerHTML;
				addClass(args[i][1], 'updating');
			}

			JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

				  action: 'update'
				, fields: jsonArgs
				, id: row['id']

			}, function(result, errors) { // когда пришел ответ:

				for (var j=0; j<args.length; j++){
					args[j][1].innerHTML = result[j][jsonArgs[j]['field']];
					created.innerHTML = txt['modified'] + result[j]['msg_modified'];
					removeClass(args[j][1], 'updating');
				}

			}, true /* запрещать кеширование */ );
		}

		// местная функция добавления кнопки с подсказкой
		var addBtn = function(name, caption){
			var btn = newel('div', 'sbtn '+name, null, caption ? '<span>'+caption+'</span>' : null);
			controls.appendChild(btn);

			btn.onmouseover = function(){
				explain.innerHTML = txt['explain_'+name];
			}
			btn.onmouseout = function(){
				explain.innerHTML = '';
			}
			return btn;
		}

		// создаем элементы и применяем простые модификации
		var container	= newel('div', type+' revealer', type+'_'+row['id']);
		var infobar		= newel('div', 'infobar');
		var msgid		= newel('div', 'msgid', null, '&nbsp;#'+row['id']+'&nbsp;')
		var created		= newel('div', 'created reveal');
		var author		= newel('div', 'author_email', null, txt['from']+row['author_email']);
		var message		= newel('div', 'message', null, row['message']);
		var controls	= newel('div', 'controls reveal');
		var explain		= newel('div', 'explain subtext');

		created.innerHTML = row['modified'] ? txt['modified'] + row['modified'] : row['created'];

		// действия в зависимости от типа блока
		if (type == 'topic') {
			// вешаем на клик событие загрузки сообщений
			container.onclick = function(){
				fillPosts(row['id'], ID('content_2'));
				setCookie('currentTopic', row['id']);
				adress.set('topic', row['id']);
				adress.del('message');
			}

			// создаем элемент "тема"
			var topic = newel('div', 'topicname editabletopic', null,
				row['topic'] ? row['topic'] : '&nbsp;');

			// функция инлайн-редактирования темы
			var editTopicName = function(){
				topic.ondblclick = null;
				topic.contentEditable = true;
				var text = topic.innerHTML;
				topic.focus();
				addClass(topic, 'edittopicname');

				var okbtn = insAfter(topic, newel('div', 'okbtn', null));

				//!! дописать отмену и расположение кнопок
				var submitTopicName = function(){
					removeClass(topic, 'edittopicname');
					topic.ondblclick = editTopicName;
					remove(okbtn);
					topic.contentEditable = false;

					// !! не работает. попробовать регекспом
					if (topic.innerHTML == ''){
						topic.innerHTML = text;
						return;
					}

					// AJAX-запрос и заполнения поля
					editFields(['msg_topic', topic]);
				}

				document.onkeypress = function(event){
					var key = event.keyCode || event.which;
					if (key == 13){
						submitTopicName();
						document.onkeypress = null;
					} // on enter
				}
				okbtn.onclick = submitTopicName;
			}

			// !! Заглушка: если имеем право переименовывать тему
			if (1 == 1) {topic.ondblclick = editTopicName;}

		} else if (type == 'post') {

			// вешаем ID на контейнер сообщения для возможности прикрепления визивига
			message.id = 'message_'+row['id'];

			var avatar	= newel('div', 'avatar', null, '<img src="'+row['avatar_url']+'">');

			container.onclick = function(){
				adress.set('message', row['id']);
			}

			// Редактирование сообщения
			var editMessage = function(){

				var backupMsg = message.innerHTML;

				// создаем визивиг и элементы управления
				var editor = veditor();
				hide(infobar, controls);
				editor.panelInstance(message.id);
				gcl('nicEdit-panel', container)[0].style.paddingLeft = '47px';
				message.focus();
				var editControls = newel('div','controls');


				// программируем кнопки
				var cancelEdit = function(){
					remove(editControls);
					editor.removeInstance(message.id);
					editor.removePanel(message.id);
					unhide(infobar, controls);
				}

				var updateMessage = function(){
					editFields(['msg_body', message]);
					cancelEdit();
				}

				var cancelBtn = newel('div', 'sbtn cancel', null, '<span>'+ txt['cancel'] +'</span>');
				var sendBtn = newel('div', 'sbtn save', null, '<span>'+ txt['save'] +'</span>');
				cancelBtn.onclick = function(){
					cancelEdit();
					message.innerHTML = backupMsg;
				}
				sendBtn.onclick = updateMessage;

				// собираем конструктор
				container.appendChild(editControls);
				appendKids(editControls, cancelBtn, sendBtn, newel('div', 'clearboth'));
			}

			// Удаление сообщения
			var deleteMessage = function(){
				var confirmed = confirm(txt['msg_del_confirm']);
				if (!confirmed) return;

				JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

					  action: 'delete'
					, id: row['id']

				}, function(result, errors) { // когда пришел ответ:

					if (result['confirmed']) {
						if (ifClass(container, 'lastblock')){
							addClass(prevElem(container), 'lastblock');
						}
						remove(container);
					}

				}, true /* запрещать кеширование */ );
			}

			// Добавление сообщения
			var addMessage = function(button, plain){

				removeClass(controls, 'reveal');
				addClass(controls, 'invis');

				// бекап функции
				var backupFunc = button.onclick;
				button.onclick = null;

				// добавление блока
				var answerBlock = newel('div', 'add_message');
				if (!plain) addClass(answerBlock, 'branched');

				var form = newel('form');
				var msgParent = plain ? topicID : row['id']
				var textarea = newel('textarea', null, 'textarea_'+msgParent);

				insAfter(container, answerBlock);
				answerBlock.appendChild(form);
				form.appendChild(textarea);

				var editor = veditor();
				editor.panelInstance(textarea.id);

				var cancelMsg = function(){

					contArea.scrollTop -= answerBlock.offsetHeight;

					editor.removeInstance(textarea.id);
					editor.removePanel(textarea.id);

					remove(answerBlock);
					removeClass(controls, 'invis');
					addClass(controls, 'reveal');
					
					button.onclick = backupFunc;
					//alert(form.nodeName);
				}

				var sendMsg = function(){
					textarea.disabled = true;
					textarea.className = 'throbber_gray';
					
					var msg_text = textarea.value || gcl('nicEdit-main')[0].innerHTML;

					// AJAX:
					JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

						  action: 'insert_post'
						, topic: topicID
						, parent: msgParent
						, message: msg_text

					}, function(result, errors) { // что делаем, когда пришел ответ:

						if (plain){
							
							removeClass(prevElem(answerBlock), 'lastblock');
							insAfter(container, branch.createBlock(result)); // вставляем новый блок
							addClass(prevElem(answerBlock), 'lastblock');
							
						} else {

							unhide(collEx);
							var newBranch = new Branch(branch.branchCont, topicID, msgParent);
							newBranch.branchCont.style.borderLeft = '30px solid #cccccc';
							insAfter(container, newBranch.branchCont);
							newBranch.appendBlock(result);
							
						}

						maxPostId = result['id']*1;

						cancelMsg();

						// Дебажим:
						ID('debug').innerHTML = errors;

					}, true /* запрещать кеширование */ );
				}
				
				var answControls = newel('div', 'controls');
				//form.appendChild(newel('div', 'subtext w80', null, txt['how_to_send_post']));
				form.appendChild(answControls);
				
				form.appendChild(newel('div','clearboth'));

				var cancel = newel('div', 'button', 'cancel_post', '<span>'+txt['cancel']+'</span>');
				var send = newel('div', 'button', 'send_post', '<span>'+txt['send']+'</span>');
				answControls.appendChild(cancel);
				answControls.appendChild(send);

				cancel.onclick = cancelMsg;
				send.onclick = sendMsg;

				contArea.scrollTop += answerBlock.offsetHeight;
			}


			// добавляем кнопки
			//var branchBtn = addBtn('addbranch', txt['answer']);
			//branchBtn.onclick = function(){addMessage(branchBtn);}

			var plainBtn = addBtn('plainanswer', txt['answer']);
			plainBtn.onclick = function(){addMessage(plainBtn, 'plain');}

			addBtn('editmessage').onclick = editMessage;
			message.ondblclick = editMessage;
			// !! заглушка: сделать функцию удаления всей темы
			if (row['id'] != topicID) addBtn('deletemessage').onclick = deleteMessage;

			var collEx = addBtn('collex');
			hide(collEx);
			collEx.onclick = function(){alert('collapse/expand ');}

			controls.appendChild(explain);
		}

		// собираем конструктор воедино
		
		controls.appendChild(newel('div','clearboth'));

		appendKids(infobar, avatar, created, author, msgid, newel('div','clearboth'));
		appendKids(container, infobar, topic, message, controls, newel('div','clearboth'));

		return container;
	}

	this.appendBlock = function(row){
		var block = branch.createBlock(row);
		branch.branchCont.appendChild(block);
		return block;
	}
}




// заполняет колонку сообщениями
function fillPosts(parent, container) {

	var type = (parent == '0') ? 'topic' : 'post';

	var col = container.id.replace('content_', '');
	var tbar = gcl('col_titlebar', ID('col_'+col))[0];
	var sbar = gcl('col_statusbar', ID('col_'+col))[0];

	addClass(tbar, 'tbar_throbber');

	// запоминаем время начала выполнения запроса
	var d = new Date;
	var before = d.getTime();

	var load = function(){
		return;
	}

	// AJAX:
	JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

		  action: 'load_posts'
		, id: parent

	}, function(result, errors) { // что делаем, когда пришел ответ:

		container.innerHTML = '';
		removeClass(tbar, 'tbar_throbber');
		var homeBranch = new Branch (container, parent);

		sbar.innerHTML = finalizeTime(before)+'ms';

		// создаем экземпляр содержимого колонки и заполняем его
		var block; // (в этой переменной будет храниться последний блок текущей ветки)
		var j = 0;
		for (var i in result) {
			// !! в хроме почему-то аппендится в обратном порядке
			if(!first) var first = result[i];
			block = homeBranch.appendBlock(result[i]);
			if (i*1 > j) j = i*1;
		}

		if (type == 'post') { // ..если это сообщения:
			// прокрутка до указанного поста или в конец
			var refPost;
			if ((refPost = adress.get('message')) && ID('post_'+refPost)) {
				ID('post_'+refPost).scrollIntoView();
			} else {
				homeBranch.e.scrollTop = homeBranch.e.scrollHeight; // прокручиваем до конца
			}
			// что по прокрутке делаем
			homeBranch.e.onscroll = function(){
				sbar.innerHTML = homeBranch.e.scrollTop+homeBranch.e.offsetHeight;
			}
			// пишем тему в заголовке колонки сообщения
			// !! при переименовании уже загруженной темы она должна переименовываться также и в заголовке
			tbar.innerHTML = txt['topic']+': '+first['topic'];
			addClass(block, 'lastblock');

			currentTopic = parent;
			maxPostId = j;
		}

		// Дебажим:
		ID('debug').innerHTML = errors;
		sbar.innerHTML += ' | '+homeBranch.e.scrollTop;

	}, true /* запрещать кеширование */ );
}


// эта функция будет обновлять темы
function updater(topic, maxid){

	// временно в первой колонке
	var tbar = gcl('col_titlebar', ID('col_0'))[0];
	addClass(tbar, 'tbar_throbber');

	// AJAX:
	JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

		  action: 'wait_post'
		, topic: topic
		, maxid: maxid

	}, function(result, errors) { // что делаем, когда пришел ответ:

		removeClass(tbar, 'tbar_throbber');
		ID('content_0').innerHTML = result;
		ID('debug0').innerHTML = errors;

	}, true /* запрещать кеширование */ );
}

function startEngine(){
	fillPosts('0', ID('content_1'));
	if ((currentTopic = adress.get('topic'))){
		fillPosts(currentTopic, ID('content_2'));
	}
	//setTimeout('updater()', 1000);
	var tbar = gcl('col_titlebar', ID('col_0'))[0];
	tbar.onclick = function(){
		updater(currentTopic, maxPostId);
	}
}

/*

// AJAX:
JsHttpRequest.query( 'ajax_backend.php', { // аргументы:

	action: 'load_posts'

}, function(result, errors) { // что делаем, когда пришел ответ:

}, true ); // запрещать кеширование

*/