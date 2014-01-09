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
    data:{}, // здесь пока будут данные о сборке интерфейса

    // экземпляры классов
    chunks:null,
    rotor:null,
	stateService:null,
    ui:null,
    address:null,
	user:null,

    // наборы статических методов
    funcs:null, // независимые от движка функции

    protos:{ // прототипные классы
        ui:{}, // ..контролов и интерфейсных элементов
		strategic:{} // классы, которые не используются напрямую, а являются исходниками для стратегических врапперов
    }
}

// Данные о сборке интерфейса
tinng.data = {
    units:[
        {name:'topics', css:{width:'40%'},
            header:[
                {type:'Button', label:'newTopic', cssClass:'right', icon:'doc_plus_w.png', text:tinng.txt.new_topic}
            ]
        },
        {name:'posts', css:{width:'60%'},
            header:[
                {type:'Button', label:'topicRename', cssClass:'right reveal3', icon:'pencil_w.png', tip:tinng.txt.rename_topic},
                {type:'Field', label:'topicName', cssClass:'topicname'},
                {type:'Button', label:'cancel', cssClass:'right', icon:'cancel_w.png', tip:tinng.txt.cancel},
                {type:'Button', label:'save', cssClass:'right', icon:'round_checkmark_w.png', tip:tinng.txt.save},
				{type:'Button', label:'cancelNewTopic', cssClass:'right', icon:'cancel_w.png', tip:tinng.txt.cancel_new_topic}
            ]
        }
    ]
}

// Колекция параметров, передаваемых на сервер при каждом запросе
tinng.sync = {
    action:'',
    maxdateTS:0,
    curTopic:0,
    plimit:1,
    pglimdateTS:0,
    topicSort:'updated',
    tsReverse:true,
	filterQuery:'',
    params:{}
}

tinng.state.blurred = false; //TODO: отслеживать активность окна
tinng.state.userID = userID;

t = tinng;