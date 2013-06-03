function TabSwitcher(){
	var tabs = e('.tab', '#mode_tabs', true);
	var ports = e('.viewport', '#app_area', true);
	
	editCSS('#mode_tabs .tab', 'width: '+(100/tabs.length).toFixed(2)+'%');
	
	this.coll = {};
	var that = this;
	
	var Tab = function(name){
		var tab = e('#tab_'+name);
		
		this.activate = function(){
			for (var t in tabs) removeClass(tabs[t], 'active');
			for (var p in ports) hide(ports[p]);
			addClass(tab, 'active');
			unhide(e('#viewport_'+name));
		}
		
		tab.onclick = this.activate;
	}
	
	this.switchto = function(name){
		that.coll[name].activate();
	}
	
	for (var n in tabs){
		name = tabs[n].id.replace('tab_', '');
		that.coll[name] = new Tab(name);
	}
}

function startInterface(){
	addDynamicCSS();
	tabs = new TabSwitcher;
}

function removeCurtain(){
	removeClass(e('#app_area'), 'invis');
	window.scrollTo(0,1);
}