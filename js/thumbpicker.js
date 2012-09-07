Math.easeInQuad = function (t, b, c, d) {
	t /= d;
	return c*t*t + b;
};
Math.easeOutQuad = function (t, b, c, d) {
	t /= d;
	return -c * t*(t-2) + b;
};

var FS = {};

FS.IE = document.all?true:false;

FS.thumbpicker = (function() {
	var container,
		scrollpad,
		isslideshow,
		isscrolling,
		istouchdevice = (typeof(window.ontouchstart) != 'undefined') ? true : false,
		ul,
		lis,
		selected_li,
		anchors = [],
		thumb_width,
		container_width,
		scrollable_width,
		ul_width,
		ul_scrollable_width,
		tick_multiplyer = FS.IE? 30 : 20,
		requestAnimFrame =
			window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(fn) {
				//Just 30 fps, because that's enough for those legacy browsers
				window.setTimeout(fn, 1000 / 30);
			},
		clientx = 0,
		mouseout_to, /* timeout to stop mouseout from over-firing */
		slideshow_to, /* timeout for slideshow */
		istouchdown = false,
		istickon = false,
		SELECTED = 'selected',
		HOVER = 'hover';
	
	function onLiHit(e) {
		//console.log('on li hit');
		//console.log(this);
		if(this!==window) {
			//console.log('hit had event');
			var self=this;
			selected_li = self;
		}
		for(var i=0; i<lis.length; i++) {
			if(lis[i]!==self) {
				lis[i].className = '';
			}
		}
		selected_li.className = SELECTED;
	}
	function onLiOver(e) {
		var self=this;
		if(self.className!==SELECTED) {
			self.className = HOVER;
		}
		return false;
	}
	function onLiOut(e) {
		var self=this;
		if(self.className!==SELECTED) {
			self.className = '';
		}
		return false;
	}
	
	var client_x = document.getElementById('clientx').getElementsByTagName('span')[0],
		bodyleft = document.getElementById('bodyleft').getElementsByTagName('span')[0],
		disp_pct = document.getElementById('pct').getElementsByTagName('span')[0],
		disp_ultargpos = document.getElementById('ul_targ_pos').getElementsByTagName('span')[0],
		disp_diff = document.getElementById('diff').getElementsByTagName('span')[0],
		disp_ease = document.getElementById('ease').getElementsByTagName('span')[0],
		disp_curpos = document.getElementById('curpos').getElementsByTagName('span')[0],
		disp_step = document.getElementById('step').getElementsByTagName('span')[0];
	
	function setClientX(e) {
		clearTimeout(mouseout_to);
		clearTimeout(slideshow_to);
		
		var parentoffset = container.offsetLeft,
			tempx;
		
		if (FS.IE) { // grab the x-y pos.s if browser is IE
		    tempx = event.clientX /*+ document.body.scrollLeft  */- parentoffset - scrollpad;
		    
		    bodyleft.innerHTML = document.body.scrollLeft;
		} else {  // grab the x-y pos.s if browser is non-retarded
		    tempx = e.pageX - parentoffset - scrollpad;
		}  
		  
		if (tempx < 0){tempx = 0}
		if (tempx > scrollable_width) {tempx = scrollable_width}
		clientx = tempx;
		client_x.innerHTML = clientx;
		if(!istickon) { tick(); }
	}
	
	
	function onScrubIdle(e) {
		//alert('BOOM');
		clearTimeout(mouseout_to);
		mouseout_to = window.setTimeout(function() {
			if(isslideshow) { slideshow(); }
			if(isscrolling) {
				var li_left= selected_li.offsetLeft;
				
				/*if(li_left<container_width) {
					clientx = 0;
				}else */if(li_left>=(ul_scrollable_width)) {
					//console.log(li_left+', '+ul_scrollable_width+', '+scrollable_width);
					clientx = scrollable_width;
				}else {
					var pct = li_left/ul_scrollable_width;
					//console.log(li_left+', '+ul_scrollable_width+', '+pct);
					clientx = scrollable_width*pct;
				}
			}
			if(!istickon) { tick(); }
			
		}, 50);
	}
	
	function slideshow() {
		clearTimeout(slideshow_to);
		slideshow_to = window.setTimeout(function() {
			/*
			 * Should elimate first for loop here and save selected_li as an int instead of an element
			 */
			var curnum,
				lislength = lis.length;
			for(var i=0; i<lislength; i++) {
				if(lis[i].className===SELECTED) { curnum=i; break; }
			}
			if(curnum+1<lislength) {
				curnum++;
			}else { curnum=0; }
			selected_li=lis[curnum];
			onLiHit();
			onScrubIdle();
			slideshow();
			//console.log('slideshow: '+curnum);
		}, 4000);
	}
	
	function tick() {
		istickon=true;
		requestAnimFrame(function() {
			var pct = clientx/scrollable_width,
				targetpos = Math.round(ul_scrollable_width*pct),
				currentpos = -(ul.style.left.substr(0, ul.style.left.length-2)) || 0,
				diff = targetpos - currentpos;
			
			disp_pct.innerHTML = pct;
			disp_ultargpos.innerHTML = Math.round(ul_scrollable_width*pct);
			
			disp_diff.innerHTML = diff;
			disp_curpos.innerHTML = currentpos;
			
			if(diff!==0) {
				var easedStep = Math.easeOutQuad(diff, 0, 1, ul_scrollable_width)*tick_multiplyer,
					math,
					newpos;
				disp_ease.innerHTML = easedStep;
				
				if(currentpos>targetpos) {
					math = Math.floor;
				}else {
					math = Math.ceil;
				}
				newpos = math(currentpos+easedStep);
				disp_step.innerHTML = -newpos+'px';
				ul.style.left = -newpos+'px';
				
				tick();
			}else {
				istickon=false;
			}
		});
	}
	
	function init(args) {
		container = args.container;
		scrollpad = args.scrollpad || 0;
		isslideshow = args.isslideshow || false;
		ul = container.getElementsByTagName('ul')[0];
		lis = ul.getElementsByTagName('li');
		selected_li = args['selected-li'] || lis[0];
		thumb_width = ul.getElementsByTagName('li')[0].offsetWidth;
		container_width = container.offsetWidth;
		scrollable_width = container_width - (scrollpad*2);
		ul_width = ul.offsetWidth;
		ul_scrollable_width = ul_width - container_width;
		isscrolling = (ul_width>container_width)?true:false;
		
		selected_li.className = SELECTED;
		
		for(var i=0; i<lis.length; i++) {
			var lisi = lis[i];
			anchors.push(lisi.getElementsByTagName('a')[0]);
			if(!istouchdevice) {
				lisi.onmouseover = onLiOver;
				lisi.onmouseout = onLiOut;
				lisi.onmouseup = onLiHit;
			}else {
				lisi.ontouchend = onLiHit;
			}
		}
		for(i=0; i<anchors.length; i++) {
			var anc = anchors[i];
			if(!istouchdevice) {
				anc.onmouseup = function(e) {
					//alert('hit');
					return false;
				}
			}else {
				anc.ontouchstart = function(e) {
					e.preventDefault();
					return false;
				}
			}
		}
		
		document.getElementById('is-ie').getElementsByTagName('span')[0].innerHTML = FS.IE;
		document.getElementById('is-touch').getElementsByTagName('span')[0].innerHTML = istouchdevice;
		document.getElementById('cont-wid').getElementsByTagName('span')[0].innerHTML = container_width;
		document.getElementById('ul-wid').getElementsByTagName('span')[0].innerHTML = ul_width;
		
		if(!istouchdevice) {
			if(isscrolling) { container.onmousemove = setClientX; }
			container.onmouseout = onScrubIdle;
			container.onmouseover = function(e) {
				clearTimeout(mouseout_to);
				clearTimeout(slideshow_to);
			}
		}else {
			if(isscrolling) { 
				container.ontouchstart = container.ontouchmove = function(e) {
					clearTimeout(mouseout_to);
					clearTimeout(slideshow_to);
					setClientX(e);
				}
			}
			container.ontouchend = container.ontouchleave = onScrubIdle;
		}
		
		if(isslideshow) { slideshow(); }
	}
	
	return {
		init: init
	}
}())
