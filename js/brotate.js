var polygon1 = $('#poly1');
var polygon2 = $('#poly2');
var polygon4 = $('#poly4');
var polygon5 = $('#poly5');
var polygon6 = $('#poly6');
var d = 0;
console.log(polygon1);
setInterval(function(){
	d=d+0.018;
	polygon1.css('transform', 'rotate(' + d + 'deg)');
	polygon2.css('transform', 'rotate(' + -d + 'deg)');
	polygon4.css('transform', 'rotate(' + -d + 'deg)');
	polygon5.css('transform', 'rotate(' + -d + 'deg)');
	polygon6.css('transform', 'rotate(' + -d + 'deg)');
}, 10);
