Math.easeInQuad = function (t, b, c, d) {
	t /= d;
	return c*t*t + b;
};
Math.easeOutQuad = function (t, b, c, d) {
	t /= d;
	return -c * t*(t-2) + b;
};

/*
for(var i=30; i>0; i--) {
	console.log(Math.easeOutQuad(i,0,1,30)*30);
}
*/
/*
var topnum=71,
	steps=Math.round(topnum*0.3),
	step=steps
	;

function t() {
	var num = Math.easeInQuad(((step/steps)*topnum),0,1,topnum)*topnum;
	//console.log(newnum);
	if(step>0) {
		step--;
		console.log(Math.ceil(num));
		t();
	}
}
t();
*/

var FS = {};

FS.IE = document.all?true:false;

FS.thumbpicker = (function() {
	var container,
		scrollpad,
		isslideshow,
		isscrolling,
		istouchdevice = (typeof(window.ontouchstart) != 'undefined') ? true : false,
		devicetick,
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
		uloriginx = 0,
		touchoriginx = 0,
		lasttouchx = 0,
		touchendx = 0,
		swipespeed = 0,
		swipesteps = 0,
		swipestep = 0,
		istween = false,
		isswipe = false,
		isswipepositive = false,
		istouchmoving = false,
		istickon = false,
		SELECTED = 'selected',
		HOVER = 'hover',
		TOUCHTICKCOMPLETE = 'touchtickcomplete';
	
	function onLiHit(e) {
		if(this===window && istouchdevice) { touchoriginx=clientx; } /* this is dirty. should find a better way of determining if user has swiped or not */
		if(Math.abs(touchoriginx-clientx)<3 || !istouchdevice) {
			if(this!==window) {
				var self=this;
				selected_li = self;
			}
			for(var i=0; i<lis.length; i++) {
				if(lis[i]!==self) {
					lis[i].className = '';
				}
			}
			
			
		}
		selected_li.className = SELECTED;
		istouchmoving=false;
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
		lasttouchx = clientx;
		istouchmoving=true;
		
		var parentoffset = container.offsetLeft,
			tempx;
		
		if (FS.IE) { // grab the x-y pos.s if browser is IE
		    tempx = event.clientX /*+ document.body.scrollLeft  */- parentoffset - scrollpad;
		    
		    bodyleft.innerHTML = document.body.scrollLeft;
		} else {  // grab the x-y pos.s if browser is modern
		    tempx = e.pageX - parentoffset - scrollpad;
		}  
		  
		if (tempx < 0){tempx = 0}
		if (tempx > scrollable_width) {tempx = scrollable_width}
		clientx = tempx;
		client_x.innerHTML = clientx;
		if(!istickon) { tick(); }
	}
	
	
	function onScrubIdle(e) {
		clearTimeout(mouseout_to);
		if(e!==TOUCHTICKCOMPLETE) {
			mouseout_to = window.setTimeout(function() {
				istouchmoving = false;
				if(isslideshow) { slideshow(); }
				if(isscrolling) {
					var li_left= selected_li.offsetLeft;
					
					if(istouchdevice) {
						var selectlileft = selected_li.offsetLeft;
						if(selectlileft>=ul_scrollable_width) {
							clientx=-ul_scrollable_width;
						}else {
							clientx=-selected_li.offsetLeft;
						}
						istween=true;
						
					}else {
						if(li_left>=ul_scrollable_width) {
							clientx = scrollable_width;
						}else {
							var pct = li_left/ul_scrollable_width;
							clientx = scrollable_width*pct;
						}
					}
				}
				if(!istickon) { tick(); }
				
			}, 50);
		}else {
			if(isslideshow) { slideshow(e); }
		}
	}
	
	function onContainerTouchStart(e) {
		isswipe=false;
		if(!istouchmoving) {
			istouchmoving = true;
			setClientX(e);
			touchoriginx = touchendx = lasttouchx = clientx;
			uloriginx = ul.offsetLeft;
		}
	}
	
	function slideshow(e) {
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
		}, e===TOUCHTICKCOMPLETE?8000:4000);
	}
	
	function mouseTick() {
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
	}
	
	function touchTick() {
		var currentpos = Number(ul.style.left.substr(0, ul.style.left.length-2)),
			isoutofbounds = (currentpos>0 || currentpos<-ul_scrollable_width)?true:false;
		if(istouchmoving) {
			istween=false;
			var touchoffset = clientx-touchoriginx;
			
			var	newulpos = uloriginx+touchoffset;
			if(newulpos>0) {
				newulpos/=4;
			}else if(currentpos<=-ul_scrollable_width) {
				var diff = (ul_scrollable_width+newulpos)/4;
				newulpos = Math.round(diff-ul_scrollable_width);
			}
			
			disp_diff.innerHTML = touchoffset;
			disp_ease.innerHTML = touchoriginx;
			disp_step.innerHTML = newulpos+'px';
			ul.style.left = newulpos+'px';
			
			tick();
		}else if(isswipe) {
			//console.log('swipe tick');
			var swipemult = isoutofbounds?(swipespeed/6):swipespeed;
			var swipeinc = Math.easeInQuad(((swipestep/swipesteps)*swipespeed),0,1,swipespeed)*swipemult;
			
			if(swipestep>0) {
				if(isoutofbounds) {
					if(swipestep-6>=0) { swipestep-=6; }else { swipestep=0; }
				}else {
					swipestep--;
				}
				var ulleft=currentpos;
				ulleft=Number(ulleft)+Math.ceil(swipeinc);
				//console.log(Math.ceil(swipeinc)+', '+ulleft);
				ul.style.left = ulleft+'px';
				
				
			}else {
				isswipe=false;
				//if(!isoutofbounds) { onScrubIdle(); }
				//istickon=false;
			}
			tick();
		}else if(isoutofbounds || istween) {
			//console.log('currentpos>0 || currentpos<-ul_scrollable_width' );
			var targetpos;
			
			if(currentpos>0) {
				targetpos=0;
			}else if(currentpos<-ul_scrollable_width){
				targetpos=-ul_scrollable_width;
			}else if(istween) {
				targetpos=clientx;
			}
			
			var diff = targetpos - currentpos;
			
			if(diff!==0) {
				var easedStep = Math.easeOutQuad(diff, 0, 1, ul_width)*(ul_width/6),
					math,
					newpos;
				disp_ease.innerHTML = easedStep;
				
				if(currentpos>targetpos) {
					math = Math.floor;
				}else {
					math = Math.ceil;
				}
				newpos = math(currentpos+easedStep);
				disp_step.innerHTML = newpos+'px';
				ul.style.left = newpos+'px';
				
				
			}
			tick();
		}else {
			onScrubIdle(TOUCHTICKCOMPLETE);
			istickon=false;
		}
	}
	
	function tick() {
		istickon=true;
		requestAnimFrame(devicetick);
	}
	
	function init(args) {
		container = args.container;
		scrollpad = istouchdevice?0:(args.scrollpad || 0);
		devicetick = istouchdevice?touchTick:mouseTick;
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
		
		if(!isscrolling) {
			container.style.textAlign = 'center';
			ul.style.position = 'relative';
		}
		
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
				container.ontouchstart = onContainerTouchStart;
				container.ontouchmove = setClientX;
			}
			container.ontouchend = function(e) {
				istouchmoving=false;
				var swipe = clientx-lasttouchx;
				
				if(Math.abs(swipe)>2) {
					isswipe=true;
					swipespeed = swipe;
					swipesteps = swipestep = Math.round(Math.abs(swipespeed*0.7));
				}else {
					isswipe=false;
					swipespeed=0;
					//onScrubIdle(e);
				}
			}
		}
		
		if(isslideshow) { slideshow(); }
	}
	
	return {
		init: init
	}
}())

