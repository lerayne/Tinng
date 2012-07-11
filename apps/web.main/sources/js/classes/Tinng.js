// Главный объект который передается во все прототипы.
// Здесь должен полностью прописываться интерфейс этого объекта
tinng = {

    // коллекции объектов
    units:{}, // отсеки (колонки) интерфейса
    topics:{}, // отображаемые темы
    posts:{}, // отображаемые сообщения

    // коллекции полей
    cfg:cfg, // конфигурация
    txt:txt, // текстовые переменные
    rex:rex, // регулярные выражения
    state:{}, // записи о состоянии программы
    sync:{}, // переменные, передаваемые на сервер
    data:{}, // здесь пока будут данные

    // экземпляры классов
    chunks:null,
    rotor:null,
    ui:null,
    address:null,

    // наборы статических методов
    funcs:null, // независимые от движка функции

    protos:{ // прототипные классы
        ui:{} // ..контролов и интерфейсных элементов
    }
}

// Данные
tinng.data = {
    units:[
        {name:'topics', css:{width:'40%'},
            header:[
                {type:'Button', label:'newTopic', cssClass:'right', icon:'doc_plus.png', text:tinng.txt.new_topic}
            ]
        },
        {name:'posts', css:{width:'60%'},
            header:[
                {type:'Button', label:'topicRename', cssClass:'right reveal3', icon:'pencil.png', tip:tinng.txt.rename_topic},
                {type:'Field', label:'topicName', cssClass:'left topicname'},
                {type:'Button', label:'cancel', cssClass:'right', icon:'cancel.png', tip:tinng.txt.cancel},
                {type:'Button', label:'save', cssClass:'right', icon:'round_checkmark.png', tip:tinng.txt.save}
            ]
        }
    ]
}

// Колекция параметров, передаваемых на мервер при каждом запросе
tinng.sync = {
    action:'',
    maxdateTS:0,
    curTopic:0,
    plimit:1,
    pglimdateTS:0,
    topicSort:'updated',
    tsReverse:true,
    params:{}
}

tinng.state.blurred = false; //TODO отслеживать активность окна
tinng.state.userID = userID;