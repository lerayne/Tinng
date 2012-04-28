/**
 * Created by JetBrains PhpStorm.
 * User: Lerayne
 * Date: 28.04.12
 * Time: 18:55
 * To change this template use File | Settings | File Templates.
 */

tinng.state.blurred = false;

Rotor = function(){
	var t = this.tinng;

	this.waitTime = t.state.blurred ? t.cfg['poll_timer_blurred'] : t.cfg['poll_timer'];
	this.maxdateTS = 0;
	this.started = false;
	this.timeout = false;

	// сортировка по умолчанию
	this.topicSort = 'updated';
	this.tsReverse = true;
}

Rotor.prototype = {
	tinng: tinng,

	start: function(action, params){
		var t = this.tinng;

		t.funcs.log('rotor started with timeout '+this.waitTime);

		if (this.started || this.timeout) this.stop();
		this.started = true;
	}
}



ContentStarter = function(){
	var t = this.tinng;

	t.rotor = new this.Rotor();
	t.rotor.start('load_pages');
}

ContentStarter.prototype = {
	tinng: tinng,
	Rotor: Rotor
}