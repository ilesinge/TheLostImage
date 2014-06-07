/**
	NAME:
		- HTML Invaders
		- Lorem Overlords
		- HTMLoids
		- Lorem Raiders
		- The Lost Image
	TODO:
		- Fix win screen img placement after screen crossing
		- win screen img transparency
		- Lorem bleed effect and/or "level" visibility
		- Use https://github.com/martinwells/gamecore.js !!!!!!!!!
		- Show score in lose / win screens
		- Die special effect :)
		- Level end special effect :)
		- Win special effect :)
		- ? Bug: animation flashes objects ?
		- ? Remove jQuery ?
		- Analytics + game analytics (events)
		- Enemies appearing during game
		- Random Lorem size
		- Shots deviate Lorems
		- Add scrollbar enemy or obstacle -- rotating scrollbar ? :)
		- Levels ! Lorem number, lorem complexity, speed, size, total health, etc. init function per level
		- Upgrades (new weapons, weapon speed, invicibility, move accross scrollbars, etc. via (emojis) or icons
		- ... pointer, input,
		- audio enemy, playing sound when hit
		- enemies examples :
		    - <iframe srcdoc="<div style='height:1000px;width:5px;'></div>" height="200" width="15" style="border:none;"></iframe>
		    - <input type="text"/>
		    - <select><option>Choose</option></select>
		    - <textarea></textarea> (changing sizes !)
		    - <audio controls>
		- Ratio hit/shot to calculate score / other score
		- Limited ammo + bonus
		- Add difficulty : Lorem shoot, divide, radiate, "boom" : suddenly change size, etc.
		- Base lorem damage on complexity
		- Bosses : canvases (absorbs shots), colorize
		- Boss : huge lorem
		- Share
*/

var H = {
	
	/* game vars */
	vars: {},
	
	default_vars: {
		shot_force: 5,
		player_accel: 0.3,
		friction: 1/30,
		player_health: 50,
		shot_speed: 10,
		shot_lock_delay: 300,
		lorem_min_speed: 2,
		lorem_max_speed: 5,
		lorem_min_complexity: 0,
		lorem_max_complexity: 4,
		player_max_speed: 8,
		hit_score: 10,
		kill_score: 100
	},
	
	level: 1,
	
	levels: {
		1: {
			vars: {},
			description: "Shoot 'em up!",
			init: function() {
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
			}
		},
		2: {
			vars: {},
			description: "The Lorems regroup...",
			init: function() {
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
				new H.Lorem;
			}
		}
	},
	
	height: 0,

	width: 0,

	sign_of: function(x) {
		return x > 0 ? 1 : x < 0 ? -1 : 0;
	},
	
	shots: [],
	enemies: [],
	imgs: [],
	
	score: 0,
	
	setup: function() {
		H.height = $(window).height();
		H.width = $(window).width();
		H.set_keys();		
		H.flash(ich.tpl_welcome(), 'Start',	H.play_level);
	},
	
	// 12 = Ctrl, 88 = x, 32 = space
	keys: {88: false, 37: false, 38: false, 39: false, 40: false},
	
	set_score: function(score) {
		H.score = score;
		$('#score_value').text(H.score);
	},
	add_score: function(score) {
		H.set_score(H.score + score);
	},
	
	flash: function(html, button_text, callback) {
		$('#flash_content').html(ich.tpl_flash({html: html, button_text: button_text}));
		$('#flash').fadeIn(2000);
		
		var _continue_key = function(e){
			if (e.which == 32) {
				_continue();
			}
		}
		var _continue = function(){
			$('#flash').fadeOut();
			$('#flash_content').html('');
			$(document).unbind('keypress', _continue_key);
			$(document).keypress(H.cancel_space);
			callback();
		};
		$(document).unbind('keypress', H.cancel_space);
		$(document).keypress(_continue_key);
		$('#continue').click(_continue);
	},
	
	corrupt: function(element, remove, exchange) {
		var h = element.innerHTML;
		var l = h.length;
		var c = function (l) {
			return Math.floor((Math.random() * l) + 1);
		}
		var r = function(s, i, c) {
			return s.substr(0, i) + c + s.substr(i + 1);
		}
		
		for (remove; remove > 0; remove --) {
			var x = c(l);
			h = r(h, x, '');
			l --;
		}
		
		for (exchange; exchange > 0; exchange --) {
			var x1 = c(l);
			var x2 = c(l);
			var t = h[x1];
			h = r(h, x1, h[x2]);
			h = r(h, x2, t);
		}
		
		element.innerHTML = h;
	},
	
	controls: function() {
		var accel_x = 0;
		var accel_y = 0;
		if (H.keys[38]) {
			// Up
			accel_y -= H.vars.player_accel
		}
		if (H.keys[40]) {
			// Down
			accel_y += H.vars.player_accel
		}
		if (H.keys[37]) {
			// Left
			accel_x -= H.vars.player_accel
		}
		if (H.keys[39]) {
			// Right
			accel_x += H.vars.player_accel
		}
		H.player.accel(accel_x, accel_y);
		if (H.keys[88]) {
			H.player.shoot();
		}
	},
	
	set_keys: function() {
		$(document).keydown(function(event){
			// Prevent arrow scrolling
			if (event.keyCode in H.keys) {
				event.preventDefault();
				H.keys[event.keyCode] = true;
			}
		}).keyup(function(event){
			if (event.keyCode in H.keys) {
				H.keys[event.keyCode] = false;
			}
		});
	},
	
	loop: function() {
		if (!H.stopped) {
			H.controls();
			H.move();
			H.shots = $.grep(H.shots, function(v) {return typeof v !== "undefined";});
			H.check_win();
			window.setTimeout(H.loop, 20);
		}
	},
	
	move: function() {
		H.player.move();
		$.each(H.shots, function(index, shot) {
			shot.move();
			shot.check_collisions();
		});
		$.each(H.enemies, function(index, enemy) {
			enemy.move();
		});
		H.player.check_collisions();
	},
	
	stop: function() {
		H.stopped = true;
	},
	
	cancel_space: function(e){
		if (e.which == 32) {
			e.preventDefault();
		}
	},
	
	start: function() {
		H.stopped = false;
		H.init();
		H.loop();
	},
	
	check_win: function() {
		if (H.enemies.length == 0) {
			H.stop();
			H.clean();
			if ((H.level + 1) in H.levels) {
				H.level++;
				H.play_level();
			}
			else {
				H.win();
			}
		}
	},
	
	lose: function() {
		H.stop();
		H.set_score(0);
		H.clean();
		H.flash(ich.tpl_lose(), 'Restart', H.play_level);
	},
	
	win: function() {
		var data = {score: H.score, level: H.level};
		H.set_score(0);
		H.level = 1;
		H.flash(ich.tpl_win(data), 'Continue', function(){window.location.reload();});
		new H.Img('<img class="img" src="img/cernettes.jpg" />');
		new H.Img('<img class="img" src="img/nyan_cat.gif" />');
		new H.Img('<img class="img" src="img/pileofpoo.png" />');
		var _win_loop = function() {
			$.each(H.imgs, function(index, img) {
				img.move();
			});
			window.setTimeout(_win_loop, 20);
		}
		_win_loop();
	},
	
	clean: function() {
		H.player.disappear();
		$.each(H.shots, function(index, shot) {
			if (typeof shot !== "undefined") {
				shot.disappear();
			}
		});
		$.each(H.enemies, function(index, enemy) {
			if (typeof enemy !== "undefined") {
				enemy.disappear();
			}
		});
		H.shots = [];
		H.enemies = [];
	},
	
	init: function() {
		H.player = new H.Player;
		H.levels[H.level].init();
	},
	
	play_level: function() {
		H.vars = $.extend({}, H.default_vars, H.levels[H.level].vars);
		$('#level').html(ich.tpl_level({level: H.level, description: H.levels[H.level].description}));
		$('#level').fadeIn(1500, function(){
			$(this).fadeOut(1500, function(){
				H.start();		
			});
		});
	}
	
};

/**
 * Movable type
 */
H.Movable = function () {};
H.Movable.prototype = {
	object: null,
	x: 0,
	y: 0,
	speed_x: 0,
	speed_y: 0,
	crossable: true,
	collide: function(other, tolerance) {
		if (!tolerance) {
			tolerance = 0;
		}
		return ((this.x + this.width > other.x + tolerance) &&
				 (this.x + tolerance < other.x + other.width) &&
				 (this.y + this.height > other.y + tolerance) &&
				 (this.y + tolerance < other.y + other.height));
	},
	total_speed: function() {
		return Math.sqrt(Math.pow(this.speed_y, 2) + Math.pow(this.speed_x, 2));
	},
	appear: function() {
		this.object.css('left', this.x);
		this.object.css('top', this.y);
		$('#game').append(this.object);
		this.height = this.object.height();
		this.width = this.object.width();
	},
	disappear: function() {
		this.object.remove();
	},
	cross_screen: function() {
		if (this.y < -this.height || this.y > H.height || this.x > H.width || this.x < -this.width) {
			if (this.crossable) {
				if (this.y < -this.height) {
					this.y = H.height;
					this.object.css('top', H.height+'px');
				}
				if (this.y > H.height) {
						this.y = -this.height;
						this.object.css('top', '-'+this.height+'px');
				}
				if (this.x > H.width) {
					this.x = -this.width;
					this.object.css('left', '-'+this.width+'px');
				}
				if (this.x < -this.width) {
					this.x = H.width;
					this.object.css('left', H.width+'px');
				}
			}
			else {
				this.disappear();
			}
		}
	},
	move: function() {
		this.cross_screen();
		this.x += this.speed_x;
		this.y += this.speed_y;
		this.object[0].style.top = this.y;
		this.object[0].style.left = this.x;
	},
	accel: function(accel_x, accel_y) {
		// Naive friction
		if (accel_x == 0 || H.sign_of(accel_x) !== H.sign_of(this.speed_x)) {
			this.speed_x -= this.speed_x * H.vars.friction;
		}
		if (accel_y == 0 || H.sign_of(accel_y) !== H.sign_of(this.speed_y)) {
			this.speed_y -= this.speed_y * H.vars.friction;
		}
		// Base acceleration
		this.speed_x += accel_x;
		this.speed_y += accel_y;
		
		if (this.max_speed) {
			// Do not cross max speed in one direction
			if (Math.abs(this.speed_x) > this.max_speed) {
				this.speed_x = this.speed_x / Math.abs(this.speed_x) * this.max_speed;
			}
			if (Math.abs(this.speed_y) > this.max_speed) {
				this.speed_y = this.speed_y / Math.abs(this.speed_y) * this.max_speed;
			}
			// Max speed in two directions
			if (this.total_speed() > this.max_speed) {
				// Only one acceleration, decrease the other one
				if (accel_x != 0 && accel_y == 0) {
					this.speed_y = this.speed_y / Math.abs(this.speed_y) * Math.sqrt(Math.pow(this.max_speed, 2) - Math.pow(this.speed_x, 2));
				}
				if (accel_y != 0 && accel_x == 0) {
					this.speed_x = this.speed_x / Math.abs(this.speed_x) * Math.sqrt(Math.pow(this.max_speed, 2) - Math.pow(this.speed_y, 2));
				}
				// Two keys pressed
				if (accel_x != 0 && accel_y != 0) {
					// Decrease the most speedy direction
					if (Math.abs(this.speed_x) > Math.abs(this.speed_y)) {
						this.speed_x -= (accel_x * 1.2);
						// And calculate the other direction if current acceleration is in the same direction
						if (H.sign_of(this.speed_y) == H.sign_of(accel_y)) {
							this.speed_y = this.speed_y / Math.abs(this.speed_y) * Math.sqrt(Math.pow(this.max_speed, 2) - Math.pow(this.speed_x, 2));
						}
					}
					else if (Math.abs(this.speed_y) > Math.abs(this.speed_x)) {
						this.speed_y -= (accel_y * 1.2);
						if (H.sign_of(this.speed_x) == H.sign_of(accel_x)) {
							this.speed_x = this.speed_x / Math.abs(this.speed_x) * Math.sqrt(Math.pow(this.max_speed, 2) - Math.pow(this.speed_y, 2));
						}
					}
					// Same speed, standard hypothenuse
					else {
						this.speed_x = H.sign_of(this.speed_x) * Math.sqrt(Math.pow(this.max_speed, 2)/2)
						this.speed_y = H.sign_of(this.speed_y) * Math.sqrt(Math.pow(this.max_speed, 2)/2)
					}
				}
			}
		}
	}
};

/**
 * Main character
 */
H.Player = function(){
	this.set_health(H.vars.player_health);
	this.max_speed = H.vars.player_max_speed;
	this.x = H.width/2;
	this.y = H.height/2;
	this.shot_locked = false;
	this.object = $(ich.tpl_player());
	this.appear();
};
H.Player.prototype = new H.Movable;
H.Player.prototype.set_health = function(health) {
	this.health = health;
	var health_display = $('#health');
	health_display.css('width', this.health * 5);
	var half = H.vars.player_health / 2;
	var diff = this.health - half;
	if (diff > 0) {
		var green = 255;
		var red = 255 - Math.round(255 * diff / half);
	}
	else {
		var red = 255;
		var green = 255 - Math.round(255 * Math.abs(diff) / half);
	}
	health_display.css('background-color', 'rgb('+red+','+green+',0)');
}
H.Player.prototype.shoot = function() {
	if (!this.shot_locked) {
		// Lock the cannon
		this.shot_locked = true;
		var current_speed = this.total_speed();
		// Total shot speed = 10
		if (current_speed) {
			var speed_x = this.speed_x / current_speed * H.vars.shot_speed;
			var speed_y = this.speed_y / current_speed * H.vars.shot_speed;
		}
		else {
			// Not moving ? shoot to right
			var speed_x = H.vars.shot_speed;
			var speed_y = 0;
		}
		H.shots.push(new H.Shot(this.x, this.y, speed_x, speed_y));
		// Unlock the cannon in 500ms
		window.setTimeout('if (!H.stopped) H.player.shot_locked = false', H.vars.shot_lock_delay);
	}
}
H.Player.prototype.check_collisions = function() {
	var that = this;
	$.each(H.enemies, function(index, enemy) {
		if (that.collide(enemy)) {
			that.set_health(that.health -1);
			that.bleed();
			if (that.health == 0) {
				H.lose();
				return false;
			}
		}
	});
}
H.Player.prototype.disappear = function() {
	this.object.remove();
	delete H.player;
}
H.Player.prototype.bleed = function() {
	var corpse = $(ich.tpl_corpse({text: ich.tpl_player()}));
	corpse.css('left', this.x - 50);
	corpse.css('top', this.y + 10);
	$('#game').append(corpse);
	corpse.fadeOut(2000, function(){
		this.remove();
	});
}

/**
 * Player H.shots
 */
H.Shot = function(x, y, speed_x, speed_y) {
	this.x = x;
	this.y = y;
	this.speed_x = speed_x;
	this.speed_y = speed_y;
	var angle = Math.atan2(speed_y, speed_x) * 180/Math.PI;
	this.crossable = false;
	this.object = $(ich.tpl_shot());
	this.object.css('transform', 'rotate('+angle+'deg)');
	this.appear();
}
H.Shot.prototype = new H.Movable;
H.Shot.prototype.disappear = function() {
	this.object.remove();
	delete H.shots[H.shots.indexOf(this)];
}
H.Shot.prototype.check_collisions = function() {
	var that = this;
	$.each(H.enemies, function(index, enemy) {
		if (that.collide(enemy, 5)) {
			that.disappear();
			enemy.bleed(H.vars.shot_force);
		}
	});
	H.enemies = $.grep(H.enemies, function(v) {return typeof v !== "undefined";});
}

/**
 * Lorem Overlords !
 */
H.Lorem = function() {
	this.x = H.width/2;
	this.y = H.height/2;
	while ((this.x + 200 > H.width/3) && (this.x < H.width*2/3)) {
		this.x = Math.random() * H.width;
	}
	while ((this.y + 200 > H.height/3) && (this.y < H.height*2/3)) {
		this.y = Math.random() * H.height;
	}
	var min_speed = Math.sqrt(Math.pow(H.vars.lorem_min_speed/2, 2));
	var max_speed = Math.sqrt(Math.pow(H.vars.lorem_max_speed/2, 2));
	this.speed_x = ((Math.random() * (max_speed - min_speed)) + min_speed) * H.sign_of(Math.random()-0.5);
	this.speed_y = ((Math.random() * (max_speed - min_speed)) + min_speed) * H.sign_of(Math.random()-0.5);
	var text = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
	var complexity = Math.floor(Math.random()*(H.vars.lorem_max_complexity - H.vars.lorem_min_complexity) + H.vars.lorem_min_complexity);
	this.tags = ['strong', 'em', 'del', 'sub', 'sup', 'u', 'big', 'marquee']
	
	var c = function (l) {
		return Math.floor((Math.random() * l) + 1);
	}
	
	var insert = function(b, i, s) {
		return (b.slice(0, i) + s + b.slice(i));
	};
	
	for (complexity; complexity > 0; complexity --) {
		var tag = this.tags[Math.floor(Math.random()*this.tags.length)];
		
		do {
			var i1 = c(text.length);
			var i2 = c(text.length);
		} while (i2 <= (i1 + tag.length + 3));
		
		text = insert(text, i1, '<'+tag+'>');
		text = insert(text, i2, '</'+tag+'>');
	}
	this.object = $(ich.tpl_lorem({text: text}));
	this.object.attr('data-complexity', this.complexity);
	H.enemies.push(this);
	this.appear();
}
H.Lorem.prototype = new H.Movable;
H.Lorem.prototype.disappear = function() {
	this.object.remove();
	delete H.enemies[H.enemies.indexOf(this)];
}
H.Lorem.prototype.bleed = function(force) {
	if (this.object.find(this.tags.join()).size()) {
		H.corrupt(this.object[0], force, force);
		this.height = this.object.height();
		this.width = this.object.width();
		H.add_score(H.vars.hit_score);
	}
	else {
		this.disappear();
		H.add_score(H.vars.kill_score);
	}
}

/**
 * Win screen imgs
 */
H.Img = function(html) {
	this.x = Math.random() * H.width;
	this.y = Math.random() * H.height;
	this.speed_x = ((Math.random() * 4) + 1) * H.sign_of(Math.random()-0.5);
	this.speed_y = ((Math.random() * 4) + 1) * H.sign_of(Math.random()-0.5);
	this.crossable = true;
	this.object = $(html);
	this.object.css('left', this.x);
	this.object.css('top', this.y);
	H.imgs.push(this);
	$('#flash_content').append(this.object);
	this.height = this.object.height();
	this.width = this.object.width();
}
H.Img.prototype = new H.Movable;

$(document).ready(function(){
	H.setup();
});