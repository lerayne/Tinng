/**
 * Created by JetBrains PhpStorm.
 * User: Lerayne
 * Date: 28.04.12
 * Time: 18:55
 * To change this template use File | Settings | File Templates.
 */

/* ОСНОВНОЙ ДВИЖОК ОБНОВЛЕНИЯ */

tinng.protos.Rotor = function (backendURL, syncCollection, parseCallback) {
    var t = this.tinng;

    this.backendURL = backendURL;
    this.syncCollection = syncCollection; //TODO придумать, как передавать параметры, чтобы ротор был более независимым
    this.parseCallback = parseCallback;

    this.waitTime = t.state.blurred ? t.cfg['poll_timer_blurred'] : t.cfg['poll_timer'];
    this.request = false; // запрос
    this.timeout = false; // текущий таймаут

    this.$stateIndicator = $('.state-ind');

    // проксирование функций
    this.start = $.proxy(this, 'start');
    this.stop = $.proxy(this, 'stop');
    this.onResponse = $.proxy(this, 'onResponse');
    this.onAbort = $.proxy(this, 'onAbort');
}

tinng.protos.Rotor.prototype = {
    tinng:tinng,

    // главная функция ротора
    start:function (action, params) {
        var t = this.tinng;

        // параметры, которые должны не сохраняться, а задаваться каждый раз из аргументов
        t.sync.action = action ? action : '';
        t.sync.params = params ? params : {};
        this.action = t.sync.action;

        // останавливаем предыдущий запрос/таймер если находим
        if (this.request || this.timeout) this.stop();

        this.startIndication(); // показываем, что запрос начался

        // Отправляем запрос
        this.request = new JsHttpRequest();
        this.request.onreadystatechange = this.onResponse;
        this.request.open(null, this.backendURL, true);
        this.request.send(this.syncCollection);

        t.funcs.log('Launching query with timeout ' + this.waitTime);
    },

    // Останавливает ротор
    stop:function () {
        var t = this.tinng;

        this.timeout = t.funcs.advClearTimeout(this.timeout);

        if (this.request) {
            // переопределяем, иначе rotor воспринимает экстренную остановку как полноценное завершение запроса
            this.request.onreadystatechange = this.onAbort;
            this.request.abort();
            this.request = false;

            t.funcs.log('STOP occured while WAITING. Query has been ABORTED');
        }
    },

    // Выполняется при удачном возвращении запроса
    onResponse:function () {
        var t = this.tinng;

        if (this.request.readyState == 4) {

            // разбираем пришедший пакет и выполняем обновления
            t.sync.maxdateTS = this.parseCallback(this.request.responseJS, this.action, t);

            this.stopIndication(); // индикация ожидания откл
            this.request = false;
            this.timeout = setTimeout(this.start, this.waitTime);
        }
    },

    // Выполняется при принудительном сбросе запроса
    onAbort:function () {
        this.stopIndication();
    },

    // изменение времени ожидания
    changeTimeout:function (msec) {
        this.waitTime = msec;
        this.start();
    },

    // как-то отмечаем в интерфейсе что запрос ушел
    startIndication:function () {
        this.$stateIndicator.addClass('updating');
    },

    // как-то отмечаем в интерфейсе что запрос закончен
    stopIndication:function () {
        this.$stateIndicator.removeClass('updating');
    }
}
/* end of Rotor */



/* ФУНКЦИЯ РАЗБОРА ДАННЫХ ОБ ИЗМЕНЕНИИ */

tinng.funcs.parser = function (result, actionUsed) {
    var t = this.tinng;

    if (result && result.error) alert(t.txt.post_locked);

    var tProps = (result && result.topic_prop) ? result.topic_prop : [];

    var i, entry, topic, post;

    // разбираем темы
    if (result && result.topics) {

        for (i in result.topics) {
            entry = result.topics[i];
            topic = t.topics[entry.id];

            // если в текущем массиве загруженных тем такая уже есть - обновляем существующую
            if (topic) {

                if (entry.deleted) {

                    topic.remove('fast');
                    if (entry.id == t.sync.curTopic) t.funcs.unloadTopic();
                    delete(topic);

                } else {
                    topic.fill(entry);
                    topic.bump();
                }

                // если же в текущем массиве тем такой нет и пришедшая не удалена, создаем новую
            } else if (!entry.deleted) {

                topic = t.topics[entry.id] = new t.protos.TopicNode(entry);
                t.units.topics.addNode(topic);
                if (tProps['new']) topic.loadPosts();
                //ifblur_notify('New Topic: '+entry.topic_name, entry.message);
            }
        }

        t.units.topics.contentLoaded = 1;
    }

    // разбираем посты
    if (result && result.posts) {

        t.units.posts.header.topicName.$body.html(tProps.name); //вывод названия темы

        if (tProps.show_all) {
            t.units.posts.$showMore.hide();
        } else t.units.posts.$showMore.show();

        // если страница догружалась
        if (actionUsed == 'next_page') {
            var rememberTop = t.units.posts.$content.children()[0];
            var more_height = t.units.posts.$showMore.offsetHeight();
//			console.log('moreH=' + more_height);
        }

        for (var i in result.posts) {
            entry = result.posts[i];
            post = t.posts[entry.id];

            if (post) { // если в текущем массиве загруженных сообщений такое уже есть

                if (entry.deleted) {

                    post.remove();

                } else post.fill(entry);

            } else if (!entry.deleted) { // если в текущем массиве такого нет и пришедшее не удалено

                post = t.posts[entry.id] = new t.protos.PostNode(entry);
                t.units.posts.addNode(post);
            }
        }

        if (tProps.scrollto) t.posts[tProps.scrollto].show(false);

        if (actionUsed == 'next_page') {
            rememberTop.scrollIntoView(true);
//			console.log(t.units.posts.$scrollArea.scrollTop())
            t.units.posts.$scrollArea.scrollTop(t.units.posts.$scrollArea.scrollTop() - more_height - 3);
        } // todo - неправильно прокручивается, если до догрузки все сообщения помещались и прокрутка не появлялась

        // наличие id означает что тема загружается в первый раз, а не догружается.
        // todo - исправить фиговое опредление!
        if (tProps.id) {
            t.topics[tProps.id].select(); // делаем тему в столбце тем активной

            // если тема загружается не вручную кликом по ней - промотать до неё в списке
            // todo - это не работает (и в продакшне тоже) - испортилось после введения пейджинга
            if (!tProps.manual) t.topics[tProps.id].show(false);

            // управляем автопрокруткой
            // Если целевой пост задан в адресе и загружен в теме - проматываем до него
            var refPost = t.address.get('post');

            if (t.posts[refPost]) {

                t.posts[refPost].select();
                t.posts[refPost].show(false);

            } else if (tProps.date_read != 'firstRead') {
                // todo !! тут будет прокрутка до первого непрочитанного поста.
                // Сейчас - прокрутка просто до последнего сообщения в теме, если юзер уже читал эту тему
                t.units.posts.scrollToBottom();
            }
        }

        if (tProps.pglimit_date) t.sync.pglimdateTS = t.funcs.sql2stamp(tProps.pglimit_date);

        t.ui.winResize(); // потому что от размера названия темы может разнести хедер

        // todo разобраться почему работает только через анонимную функцию
        setTimeout(function () {
            this.tinng.units.posts.contentLoaded = 1
        });

//		t.units.posts.setContentLoaded();
    }

    return t.funcs.sql2stamp(result.new_maxdate);
}


tinng.funcs.parser.prototype = {
    tinng:tinng
}
/* end of parser */



/* КЛАСС ТЕГА */

tinng.protos.Tag = function (data) {
    var t = this.tinng;

    this.$body = t.chunks.get('tag');
    this.$body.text(data.name);
}

tinng.protos.Tag.prototype = {
    tinng:tinng
}
/* end of Tag */



/* КЛАССЫ НОДЫ, ТЕМЫ И ПОСТА */

tinng.protos.Node = new Class({
    tinng:tinng,

    initialize:function (data, chunkName, addCells) {
        this.construct(data, chunkName, addCells);
        this.fill(data);
    },

    construct:function (data, chunkName, addCells) {
        var t = this.tinng;

        this.$body = t.chunks.get(chunkName || 'node');

        // создаем поля главного объекта на основе данных
        this.data = data;
        this.id = parseInt(data.id);

        // заполняем коллекцию cells на основе названий полей
        var cells = [

            'infobar',
            'created',
            'author',
            'id',
            'message',
            'controls'

        ].concat(addCells || []);

        this.cells = {};
        for (var i in cells) this.cells['$' + cells[i]] = this.$body.find('[data-cell="' + cells[i] + '"]');

        // заполняем неизменные данные, присваеваемые единожды
        this.$body.attr('id', chunkName + '_' + data.id);
        this.$body.attr('data-number', data.id);
        this.cells.$message.addClass('message_' + data.id);
        this.cells.$id.text(data.id);
    },

    // заполнить данными
    fill:function (data) {
        var t = this.tinng;

        this.data = data;

        // общие поля
        this.cells.$message.html(data.message);
        this.cells.$created.text(data.modified ? t.txt.modified + data.modified : data.created);
        this.cells.$author.text(data.author);
    },

    show:function (start) {
        this.$body[0].scrollIntoView(start);
    }
});


tinng.protos.TopicNode = new Class(tinng.protos.Node, {

    construct:function (data) {

        this.tinng.protos
            .Node.prototype
            .construct.call(this, data, 'topic',
            [
                'tags',
                'lastmessage',
                'topicname',
                'postsquant'
            ]
        );

        // проксирование функций
        this.loadPosts = $.proxy(this, 'loadPosts');

        // вешаем обработчики событий
        this.$body.on('click', this.loadPosts);
    },

    // заполнить данными
    fill:function (data) {
        var t = this.tinng;

        t.protos
            .Node.prototype
            .fill.apply(this, arguments);

        this.cells.$postsquant.text(data.postsquant + t.txt.msgs);
        this.cells.$topicname.html(data.topic_name);

        // последнее сообщение
        if (data.last_id) {
            this.cells.$lastmessage.html(
                '<div>' + t.txt.lastpost + '<b>' + data.lastauthor + '</b> (' + data.lastdate + ') ' + data.lastpost + '</div>'
            );
        }

        // вбиваем теги
        //todo: сейчас теги при каждом филле обнуляются и вбиваются заново. непорядок
        if (data.tags) {
            this.cells.$tags.text('');
            for (var i in data.tags) {
                this.cells.$tags.append(new t.protos.Tag(data.tags[i]).$body);
            }
        }
    },

    // изменить положение в списке при обновлении
    bump:function () {
        var t = this.tinng;
        var topics = t.units.topics;

        switch (t.sync.topicSort) {

            // сортировка по последнему обновлению
            case 'updated':
                this.detach();

                if (t.sync.tsReverse) {
                    topics.addNodeOnTop(this)
                } else {
                    topics.addNode(this);
                }

                break;
        }
    },

    // загрузить тему
    loadPosts:function () {
        var t = this.tinng;

        t.funcs.unloadTopic();
        this.select(); // делаем тему в столбце тем активной

        t.sync.curTopic = this.id;
        t.rotor.start('load_pages');

        t.units.topics.header.newTopic.unblock();
        t.address.set({topic:this.id, plimit:t.sync.plimit});
    },

    select:function () {
        this.deselect();
        this.$body.addClass('active');
    },

    deselect:function () {
        this.tinng.funcs.topicDeselect();
    },

    // демонстрирует удаление ноды в интерфейсе и вызывает окончательное удаление
    remove:function () {
        this.deselect();
        this.$body.css({overflow:'hidden'});
        this.$body.animate({opacity:0, height:0}, 400, this.kill);
    },

    // окончательно удаляет ноду
    kill:function () {
        this.$body.remove();
        delete(this.tinng.topics[this.id]); //todo - проверить, удаляется ли сам элемент массива
    },

    detach:function () {
        this.$body.remove();
    }
});


tinng.protos.PostNode = Class(tinng.protos.Node, {

    construct:function (data) {
        var t = this.tinng;

        this.tinng.protos
            .Node.prototype
            .construct.call(this, data, 'post',
            [
                'avatar',
                'controls'
            ]
        );

        this.select = $.proxy(this, 'select');
        this.kill = $.proxy(this, 'kill');

        this.$body.click(this.select);
        //this.cells.$message.on('click', this.select);

        var author = this.data.author_id == t.state.userID; // todo - сделать нормальную авторизацию
        var admin = t.state.userID == '1';

        /* Панель действий */

        this.mainPanel = new t.protos.ui.Panel([
            {type:'Button', label:'delete', cssClass:'right', icon:'doc_delete.png', tip:t.txt.delete},
            {type:'Button', label:'edit', cssClass:'right', icon:'doc_edit.png', tip:t.txt.edit},
            {type:'Button', label:'unlock', cssClass:'right', icon:'padlock_open.png', text:t.txt.unblock}
        ]);

        this.mainPanel.unlock.$body.hide();
        if (author || admin) this.cells.$controls.append(this.mainPanel.$body);

        this.edit = $.proxy(this, 'edit');
        this.enterEditMode = $.proxy(this, 'enterEditMode');
        this.delete = $.proxy(this, 'delete');
        this.unlock = $.proxy(this, 'unlock');

        this.mainPanel.edit.on('click', this.edit);
        //this.cells.$message.on('dblclick', this.edit);
        //this.mainPanel.edit.on('click', t.funcs.stopProp);
        this.mainPanel.delete.on('click', this.delete);
        //this.mainPanel.delete.on('click', t.funcs.stopProp);
        this.mainPanel.unlock.on('click', this.unlock);

        /* панель редактирования */

        this.editorPanel = new t.protos.ui.Panel([
            {type:'Button', label:'cancel', cssClass:'right', icon:'cancel.png', text:t.txt.cancel},
            {type:'Button', label:'save', cssClass:'right', icon:'round_checkmark.png', text:t.txt.save}
        ]);

        this.editorPanel.$body.hide();
        if (author || admin) this.cells.$controls.append(this.editorPanel.$body);

        this.save = $.proxy(this, 'save');
        this.cancelEdit = $.proxy(this, 'cancelEdit');

        this.editorPanel.save.on('click', this.save);
        this.editorPanel.cancel.on('click', this.cancelEdit);
    },

    // заполнить сообщение данными
    fill:function (data) {
        this.tinng.protos
            .Node.prototype
            .fill.apply(this, arguments);

        this.cells.$avatar.attr('src', data.avatar_url);
    },

    // пометить сообщение выделенным
    select:function () {
        var t = this.tinng;

        var selected = t.state.selectedPost;

        if (!selected || selected.id != this.id) {
            if (selected) selected.deselect();

            t.state.selectedPost = this;
            this.$body.addClass('selected');
            t.address.set('post', this.id);
        } else if (selected.id == this.id) {
            this.deselect('full');
        }

        return false;
    },

    // отменяет выделение
    deselect:function (full) {
        this.$body.removeClass('selected');

        // если после этого сразу не будет новое выделение
        if (full) {
            delete(this.tinng.state.selectedPost);
            this.tinng.address.del('post');
        }
    },

    // демонстрирует удаление ноды в интерфейсе и вызывает окончательное удаление
    remove:function () {
        this.deselect();
        this.$body.css({overflow:'hidden'});
        this.$body.animate({opacity:0, height:0}, 400, this.kill);
    },

    // окончательно удаляет ноду
    kill:function () {
        this.$body.remove();
        delete(this.tinng.posts[this.id]); //todo - проверить, удаляется ли сам элемент массива
    },

    // прокручивает список до данного сообщения
    show:function (start) {
        var t = this.tinng;

        this.tinng.protos
            .Node.prototype
            .show.apply(this, arguments);

        var thisLast = this.$body.next().size() == 0;

        if (start == false) {
            var $postsU = t.units.posts;
            if (!thisLast)
                $postsU.$scrollArea.scrollTop($postsU.$scrollArea.scrollTop() + parseInt($postsU.$contentWrap.css('padding-bottom')));
            else
                $postsU.scrollToBottom();
        }
    },

    // начинает редактирование с проверки блокировки
    edit:function () {

        JsHttpRequest.query('backend/service.php', { // аргументы:
            action:'check_n_lock',
            id:this.id
        }, this.enterEditMode, true);

        return false; // preventDefault + stopPropagation
    },

    // демонстрирует блокировку, или входит в режим редактирования
    enterEditMode:function (result, errors) {
        var t = this.tinng;

        if (result.locked !== null) {

            if (t.state.userID == '1') {
                if (confirm(t.txt.post_locked + '\n' + t.txt.post_locked_admin)) {
                    this.unlock()
                } else {
                    this.mainPanel.unlock.$body.show();
                }
            } else alert(t.txt.post_locked);

        } else {

            this.messageBackup = this.cells.$message.html();

            this.mainPanel.$body.hide();
            this.editorPanel.$body.show();

            this.cells.$message.attr('contenteditable', true);
            this.cells.$message.focus();
        }
    },

    // срабатывает при отмене редактирования
    cancelEdit:function () {

        this.exitEditMode();

        this.unlock();
        this.cells.$message.html(this.messageBackup);
        this.messageBackup = '';

        return false; // preventDefault + stopPropagation
    },

    // выходит из режима редактирования
    exitEditMode:function () {
        this.editorPanel.$body.hide();
        this.mainPanel.$body.show();
        this.cells.$message.removeAttr('contenteditable');
    },

    // срабатывает при нажатии кнопки "сохранить" в режиме редактирования
    save:function () {

        this.tinng.rotor.start('update_message', {
            id:this.id,
            message:this.cells.$message.html()
        });
        this.exitEditMode();

        return false; // preventDefault + stopPropagation
    },

    // срабатывает при нажатии кнопки "удалить" в режиме редактировая
    delete:function () {
        var t = this.tinng;

        if (confirm(t.txt.msg_del_confirm)) {
            t.rotor.start('delete_message', {id:this.id});
        }

        return false; // preventDefault + stopPropagation
    },

    // принудительная запрос разблокировки. Без подтверждения
    unlock:function () {
        JsHttpRequest.query('backend/service.php', { // аргументы:
            action:'unlock_message',
            id:this.id
        }, function () {
        }, true);

        this.mainPanel.unlock.$body.hide();

        return false; // preventDefault + stopPropagation
    }
});
/* end of TopicNode */



/* функция выгрузки темы */
tinng.funcs.unloadTopic = function () {
    var t = this.tinng;

    if (t.state.selectedPost) t.state.selectedPost.deselect('full');
    t.units.posts.$content.html(''); //todo проверить полное удаление из памяти
    t.posts = {};
    t.sync.curTopic = 0;
    t.sync.pglimdateTS = 0;
    t.sync.plimit = 1;
    t.units.posts.contentLoaded = 0;
}


tinng.funcs.topicDeselect = function () {
    $('.topics .active').removeClass('active');
}