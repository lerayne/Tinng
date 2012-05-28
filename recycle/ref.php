<html>
<head>
	<script type="text/javascript" src='../libraries/jquery-1.7.2.min.js'></script>
	<script type="text/javascript">

var createElementConstructor = function(elementName, constructor) {
	return function() {
		var element = document.createElement(elementName);

		if (constructor.prototype) {
			for (var key in constructor.prototype) {
				element[key] = constructor.prototype[key];
			}
		}

		constructor.apply(element, arguments);

		return element;
	};
};

var data = {id:'12', text:'message 12'};

var post = function(){
	this.resize = $.proxy(this, 'resize');

	this.resize = function (){
		this.__proto__.resize.apply(this, arguments);
	}

	this.cells = {};
	this.cells.text = document.createElement('div');
	this.cells.text.innerHTML =	this.data.text;
	this.setAttribute('id', this.data.id);

	for (i in this.cells){
		this.appendChild(this.cells[i])
	}

	$(window).resize(this.resize);
};

post.prototype = {
	append2: function(){
		document.body.appendChild(this);
		console.log(this);
	},

	resize: function(){
		console.log(this);
	},

	data: data
};

$(function(){
//	elem = new post();
	var newPost = createElementConstructor('div', post);
	elem = new newPost();
})
	</script>
	
</head>
<body>


</body>
</html>