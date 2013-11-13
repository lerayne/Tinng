/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:51 PM
 * To change this template use File | Settings | File Templates.
 */

// Движок кусков HTML, из копий которых собирается страница
tinng.protos.ChunksEngine = function (containerId, attr) {
    this.collection = {};
    this.attr = attr;
    $('#' + containerId + ' [' + attr + ']').each($.proxy(this, 'populate'));
}

tinng.protos.ChunksEngine.prototype = {

    // заполняет коллекцию
    populate:function (index, value) {
        var $chunk = $(value);
        this.collection[$chunk.attr(this.attr)] = $chunk;
    },

    // желательно использовать этот клонирующий геттер
    get:function (name) {
        return this.collection[name] ? this.collection[name].clone() : $('<div class="' + name + '"></div>');
    }
}
