/**
    NAME:
        - HTML Invaders
        - Lorem Overlords
        - HTMLoids
        - Lorem Raiders
        - The Lost Image
    TODO:
        - single shot by key pressed (maybe can use space again to shoot)
        - use https://github.com/raphaelbastide/Terminal-Grotesque or https://github.com/raphaelbastide/steps-mono ?
        - Die special effect :)
        - Level end special effect :)
        - Win special effect :)
        - Firefox performance
        - ? Bug: animation flashes objects ?
        - ? Remove jQuery ?
        - Game analytics (events)
        - Enemies appearing during game
        - Random Lorem size
        - Shooting lorems (dolor bullets)
        - Missing bullets reduce score (5)
        - Upgrades (new weapons, weapon speed, invicibility, move accross scrollbars, etc. via (emojis) or icons
        - ... pointer, input,
        - audio enemy, playing sound when hit
        - enemies examples :
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
    ANALYTICS:
        - Level duration:
            var metricValue = '123';
            ga('set', 'metric1', metricValue);
        - Score:
            var metricValue = '123';
            ga('set', 'metric2', metricValue);
*/

var H = {
    
    show_fps: false,
    
    /* game vars */
    vars: {},
    
    default_vars: {
        shot_force: 5,
        shot_deviate_force: 1/6,
        player_accel: 0.4,
        friction: 1/30,
        player_health: 50,
        shot_speed: 10,
        shot_lock_delay: 300,
        lorem_max_speed: 7,
        lorem_start_min_speed: 2,
        lorem_start_max_speed: 6,
        lorem_min_complexity: 0,
        lorem_max_complexity: 4,
        scrollbar_start_min_speed: 2,
        scrollbar_start_max_speed: 5,
        scrollbar_health: 10,
        scrollbar_min_size: 300,
        scrollbar_max_size: 600,
        player_max_speed: 8,
        hit_score: 10,
        kill_score: 100
    },
    
    target_frame_time: 25,
    
    level: 1,
    
    time: 0,
    
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
            }
        },
        3: {
            vars: {},
            description: "What are those walls?",
            init: function() {
                new H.Scrollbar;
                new H.Scrollbar;
                new H.Scrollbar;
                new H.Scrollbar;
                new H.Lorem;
                new H.Lorem;
                new H.Lorem;
                new H.Lorem;
            }
        }
    },
    
    height: 0,
    width: 0,
    
    /**
     * Selectors
     **/
    game: null,
    health_display: null,
    flash_screen: null,
    fps: null,

    /**
     * Objects
     **/
    shots: [],
    enemies: [],
    imgs: [],
    
    score: 0,
    
    frames: 0,
    
    sign_of: function(x) {
        return x > 0 ? 1 : x < 0 ? -1 : 0;
    },
    
    each: function(collection, callback) {
        var cloned_collection = collection.slice();
        $.each(cloned_collection, callback);
    },
    
    setup: function() {
        H.game = $('#game');
        H.health_display = $('#health');
        H.flash_screen = $('#flash');
        H.fps = $('#FPS');
        var $window = $(window)
        H.height = $window.height();
        H.width = $window.width();
        H.set_keys();        
        H.flash(ich.tpl_welcome(), 'Start',    H.begin);
    },
    
    begin: function() {
        H.play_level();
    },
    
    keymap: {space: 32, left: 37, up: 38, right: 39, down: 40, x: 88},
    keys: {},
    
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
            // Enter key
            if (e.which == 13) {
                _continue();
            }
        }
        var _continue = function(){
            $('#flash').fadeOut();
            $('#flash_content').html('');
            $(document).unbind('keypress', _continue_key);
            callback();
        };
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
    
    is_pressed: function(key) {
        return H.keys[H.keymap[key]];
    },
    
    controls: function() {
        var accel_x = 0;
        var accel_y = 0;
        if (H.is_pressed('up')) {
            accel_y -= H.vars.player_accel;
        }
        if (H.is_pressed('down')) {
            accel_y += H.vars.player_accel;
        }
        if (H.is_pressed('left')) {
            accel_x -= H.vars.player_accel;
        }
        if (H.is_pressed('right')) {
            accel_x += H.vars.player_accel;
        }
        H.player.accel(accel_x, accel_y);
        if (H.is_pressed('x')) {
            H.player.shoot();
        }
    },
    
    set_keys: function() {
        for (key in H.keymap) {
            H.keys[H.keymap[key]] = false;
        }
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
            window.setTimeout(H.loop, H.target_frame_time);
            H.calc_fps_ratio();
            H.controls();
            H.move();
            H.check_win();
        }
        
        if (H.show_fps) {
            H.calc_fps();
        }
    },
    
    calc_fps: function() {
        H.frames++;
        if (H.frames == 10) {
            var time = new Date().getTime();
            var diff = time - H.last_time;
            var FPS = Math.round(1000 / (diff/10));
            H.fps.html('FPS: '+FPS);
            H.last_time = time;
            H.frames = 0;
        }
    },
    
    calc_fps_ratio: function() {
        var time = new Date().getTime();
        if (H.last_frame_time) {
            H.fps_ratio = (time - H.last_frame_time) / H.target_frame_time;
        } else {
            H.fps_ratio = 1;
        }
        H.last_frame_time = time;
    },
    
    move: function() {
        H.player.move();
        H.each(H.shots, function(index, shot) {
            shot.move();
            shot.check_collisions();
        });
        H.each(H.enemies, function(index, enemy) {
            enemy.move();
        });
        H.player.check_collisions();
    },
    
    stop: function() {
        H.stopped = true;
    },
    
    start: function() {
        H.stopped = false;
        H.last_frame_time = 0;
        H.init();
        H.loop();
    },
    
    check_win: function() {
        if (!H.stopped && H.enemies.length == 0) {
            H.stop();
            H.clean();
            H.track_level_end();
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
        H.track_lose();
        var data = {score: H.score, level: H.level};
        H.set_score(0);
        H.clean();
        H.flash(ich.tpl_lose(data), 'Restart', H.play_level);
    },
    
    win: function() {
        H.track_metrics('/win');
        var data = {score: H.score, level: H.level};
        H.set_score(0);
        H.level = 1;
        H.flash(ich.tpl_win(data), 'Play again!', function(){window.location.reload();});
        new H.Img('<img class="object img" src="img/cernettes.jpg" width="125" height="100" />');
        new H.Img('<img class="object img" src="img/nyan_cat.gif" width="200" height="84" />');
        new H.Img('<img class="object img" src="img/pileofpoo.png" width="120" height="116" />');
        new H.Img('<img class="object img" src="img/welcomer.gif" width="92" height="49" />');
        new H.Img('<img class="object img" src="img/dancingbaby.gif" width="100" height="115" />');
        new H.Img('<img class="object img" src="img/underconstruction.png" width="244" height="60" />');
        new H.Img('<img class="object img" src="img/acidtest.png" width="300" height="199" />');
        new H.Img('<img class="object img" src="img/mailbox.gif" width="29" height="34" />');
        new H.Img('<img class="object img" src="img/broken.png" width="39" height="39" />');
        var _win_loop = function() {
            H.each(H.imgs, function(index, img) {
                img.move();
            });
            window.setTimeout(_win_loop, 20);
        }
        _win_loop();
    },
    
    clean: function() {
        H.player.disappear();
        H.each(H.shots, function(index, shot) {
            shot.disappear();
        });
        H.each(H.enemies, function(index, enemy) {
            enemy.disappear();
        });
        H.shots = [];
        H.enemies = [];
    },
    
    init: function() {
        H.time = new Date().getTime();
        H.player = new H.Player;
        H.levels[H.level].init();
    },
    
    track_metrics: function(page) {
        // Set current score
        ga('set', 'metric2', H.score.toString());
        // Track page
        ga('send', 'pageview', page);
    },
    
    track_level_end: function() {
        // Set current time
        var elapsed = Math.round((new Date().getTime() - H.time)/1000);
        ga('set', 'metric1', elapsed.toString());
        ga('send', 'pageview', '/end/level'+H.level);
    },
    
    track_lose: function() {
        // Set current time
        var elapsed = Math.round((new Date().getTime() - H.time)/1000);
        ga('set', 'metric1', elapsed.toString());
        ga('set', 'metric2', H.score.toString());
        ga('send', 'pageview', '/lose/level'+H.level);
    },
    
    play_level: function() {
        H.track_metrics('/start/level'+H.level);
        // Customize level variables
        H.vars = $.extend({}, H.default_vars, H.levels[H.level].vars);
        // Start level !
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
H.Movable = gamecore.Base.extend('H.Movable',
    {},
    {
        scene: 'game',
        object: null,
        x: 0,
        y: 0,
        speed_x: 0,
        speed_y: 0,
        max_speed: 0,
        width: 0,
        height: 0,
        collection: null,
        
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
            if (this.collection) {
                H[this.collection].push(this);
            }
            H[this.scene].append(this.object);
            this.async_get_height();
        },
        async_get_height: function() {
            setTimeout(this.get_height.bind(this, this), 1);
        },
        get_height: function() {
            this.height = this.object.height();
            this.width = this.object.width();  
        },
        disappear: function() {
            this.object.remove();
            if (this.collection) {
                delete H[this.collection][H[this.collection].indexOf(this)];
                H[this.collection] = $.grep(H[this.collection], function(v){ return typeof v !== 'undefined'; });
            }
        },
        is_out_of_bounds: function() {
            return (this.y < -this.height || this.y > H.height || this.x > H.width || this.x < -this.width)
        },
        cross_screen: function() {
            this.disappear();
        },
        move: function() {
            if (this.is_out_of_bounds()) {
                this.cross_screen();
            }
            this.x += this.speed_x * H.fps_ratio;
            this.y += this.speed_y * H.fps_ratio;
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
    }
);

/**
 * Movables that can cross the screen
 */
H.Crossable = H.Movable.extend('H.Crossable', {},
    {
        cross_screen: function() {
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
    }
);

/**
 * Main character
 */
H.Player = H.Crossable.extend('H.Player', {},
    {
        health: 0,
        shot_locked: false,
        
        init: function() {
            this.set_health(H.vars.player_health);
            this.max_speed = H.vars.player_max_speed;
            this.x = H.width/2;
            this.y = H.height/2;
            this.object = $(ich.tpl_player());
            this.appear();
        },
        
        set_health: function(health) {
            this.health = health;
            H.health_display.css('width', this.health * 5);
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
            H.health_display.css('background-color', 'rgb('+red+','+green+',0)');
        },
        
        shoot: function() {
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
                new H.Shot(this.x, this.y, speed_x, speed_y)
                // Unlock the cannon in 500ms
                window.setTimeout('if (!H.stopped) H.player.shot_locked = false', H.vars.shot_lock_delay);
            }
        },
        
        check_collisions: function() {
            var that = this;
            H.each(H.enemies, function(index, enemy) {
                if (that.collide(enemy)) {
                    that.set_health(that.health -1);
                    that.bleed();
                    if (that.health == 0) {
                        H.lose();
                        return false;
                    }
                }
            });
        },
        
        disappear: function() {
            this.object.remove();
            delete H.player;
        },
        
        bleed: function() {
            var corpse = $(ich.tpl_corpse({text: ich.tpl_player()}));
            corpse.css('left', this.x - 50);
            corpse.css('top', this.y + 10);
            H.game.append(corpse);
            corpse.fadeOut(2000, function(){
                this.remove();
            });
        }
    }
);


/**
 * Player shots
 */
H.Shot = H.Movable.extend('H.Shot', {},
    {
        collection: 'shots',
        
        init: function(x, y, speed_x, speed_y) {
            this.x = x;
            this.y = y;
            this.speed_x = speed_x;
            this.speed_y = speed_y;
            var angle = Math.atan2(speed_y, speed_x) * 180/Math.PI;
            this.object = $(ich.tpl_shot());
            this.object.css('transform', 'rotate('+angle+'deg)');
            this.appear();
        },
        
        check_collisions: function() {
            var that = this;
            H.each(H.enemies, function(index, enemy) {
                if (that.collide(enemy, 5)) {
                    that.disappear();
                    enemy.accel(that.speed_x * H.vars.shot_deviate_force, that.speed_y * H.vars.shot_deviate_force);
                    enemy.bleed(H.vars.shot_force);
                }
            });
        }
    }
);


/**
 * Lorem Overlords !
 */
H.Lorem = H.Crossable.extend('H.Lorem', {},
    {
        text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        collection: 'enemies',
        
        init: function() {
            this.max_speed = H.vars.lorem_max_speed;
            this.x = H.width/2;
            this.y = H.height/2;
            while ((this.x + 200 > H.width/3) && (this.x < H.width*2/3)) {
                this.x = Math.random() * H.width;
            }
            while ((this.y + 200 > H.height/3) && (this.y < H.height*2/3)) {
                this.y = Math.random() * H.height;
            }
            var min_speed = Math.sqrt(Math.pow(H.vars.lorem_start_min_speed/2, 2));
            var max_speed = Math.sqrt(Math.pow(H.vars.lorem_start_max_speed/2, 2));
            this.speed_x = ((Math.random() * (max_speed - min_speed)) + min_speed) * H.sign_of(Math.random()-0.5);
            this.speed_y = ((Math.random() * (max_speed - min_speed)) + min_speed) * H.sign_of(Math.random()-0.5);
            var complexity = Math.floor(Math.random()*(H.vars.lorem_max_complexity - H.vars.lorem_min_complexity) + H.vars.lorem_min_complexity);
            this.tags = ['strong', 'em', 'del', 'sub', 'sup', 'u', 'big', 'marquee']
            
            var c = function (l) {
                return Math.floor((Math.random() * l) + 1);
            }
            
            var insert = function(b, i, s) {
                return (b.slice(0, i) + s + b.slice(i));
            };
            
            var text = this.text;
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
            this.appear();
        },
        
        bleed: function(force) {
            var corpse = $(ich.tpl_corpseenemy({html: this.object[0].innerHTML}));
            corpse.css('left', this.x);
            corpse.css('top', this.y);
            H.game.append(corpse);
            corpse.fadeOut(1000, function(){
                this.remove();
            });
            if (this.object.find(this.tags.join()).size()) {
                H.corrupt(this.object[0], force, force);
                this.async_get_height();
                H.add_score(H.vars.hit_score);
            }
            else {
                this.disappear();
                H.add_score(H.vars.kill_score);
            }
        }
    }
);


/**
 * Scrollbar warriors
 */
H.Scrollbar = H.Crossable.extend('H.Scrollbar', {},
    {
        collection: 'enemies',
        direction: '',
        health: 0,
        size: 0,
        
        init: function() {
            var min_speed = H.vars.scrollbar_start_min_speed;
            var max_speed = H.vars.scrollbar_start_max_speed;
            this.max_speed = max_speed;
            this.size = (Math.random() * (H.vars.scrollbar_max_size - H.vars.scrollbar_min_size)) + H.vars.scrollbar_min_size;
            var speed = ((Math.random() * (max_speed - min_speed)) + min_speed) * H.sign_of(Math.random()-0.5);
            if (Math.random() > 0.5) {
                this.direction = 'x';
                this.height = 15;
                this.width = this.size;
                this.speed_x = speed;
                this.speed_y = 0;
            }
            else {
                this.direction = 'y';
                this.height = this.size;
                this.width = 15;
                this.speed_y = speed;
                this.speed_x = 0;
            }
            this.health = H.vars.scrollbar_health;
            this.x = H.width/2;
            this.y = H.height/2;
            while ((this.x + this.width > H.width/3) && (this.x < H.width*2/3)) {
                this.x = Math.random() * H.width;
            }
            while ((this.y + this.height > H.height/3) && (this.y < H.height*2/3)) {
                this.y = Math.random() * H.height;
            }
            this.object = $(ich.tpl_scrollbar({direction: this.direction}));
            this.bar = this.object.children();
            if (this.direction == 'x') {
                this.object.css('width', this.size);
                this.bar.css('width', this.size + 1);
            }
            else {
                this.object.css('height', this.size);
                this.bar.css('height', this.size + 1);
            }
            this.appear();
        },
        
        bleed: function(force) {
            this.health = this.health -1;
            if (this.health == 0) {
                this.disappear();
                H.add_score(H.vars.kill_score);
            }
            else {
                H.add_score(H.vars.hit_score);
                var size = H.vars.scrollbar_health / this.health * this.size;
                if (this.direction == 'x') {
                    this.bar.css('width', size);
                }
                else {
                    this.bar.css('height', size);
                }
            }
        }
    }
);

/**
 * Win screen imgs
 */
H.Img = H.Crossable.extend('H.Img', {},
    {
        scene: 'flash_screen',
        collection: 'imgs',
        
        init: function(html) {
            this.x = Math.random() * H.width;
            this.y = Math.random() * H.height;
            this.speed_x = (Math.random() * 3 + 0.5) * H.sign_of(Math.random()-0.5);
            this.speed_y = (Math.random() * 3 + 0.5) * H.sign_of(Math.random()-0.5);
            this.object = $(html);
            this.appear();
        }
    }
);

$(document).ready(function(){
    H.setup();
});
