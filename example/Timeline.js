console.clear();

/*  Request Animation polyfill.
    http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
*/
(function(window, undefined) {


    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };



var Timeline = function(args) {



  /* Helper for merging objects */
  var extend = function(){
    if (arguments.length < 2) return;
    var extended = arguments[0];
    for (var _x = 1, _xx = arguments.length; _x < _xx; _x++) {
      var base = arguments[_x];
      for (var key in base) {
        extended[key] = base[key];
      }
    }
    return extended;
  };

  //Timeline related variables
  var defaults = {useRAF: false, tickInterval: 16, autostart: false},
      options = extend(defaults, args),
      ticks = 0,
      startTime = 0,
      startSeconds = 0,
      running = false,
      useRAF = options.useRAF,
      elapsedSeconds = 0,
      delta = 0,
      comparativeDelta = 0,
      lastTick = 0,
      realElapsedSeconds = 0;
      this.tickInterval = options.tickInterval;
      
  // Event Aggregator related variables
  var events = {};

  events.nominal = {};
  events.ordinal = [];
  events.loops = {};
  
  /*  Internal Functions */

  //  clock's tick mechanism
  var tick = function(_lastTick) {
    
    if (!running) return;
    
    ticks++;
    if (this.debug) this.log();

    this.delta = delta = new Date().getTime() - lastTick;
    lastTick = _lastTick || new Date().getTime();

    //this.delta = delta = ( new Date().getSeconds() / realElapsedSeconds);
    comparativeDelta = 0;
    elapsedSeconds = (ticks * delta) / 1000;

    realElapsedSeconds = ( new Date().getSeconds() - startSeconds ) ;

    // one-time events take precedence over loop events.
    triggerCurrentEvents();
    triggerLoopEvents();

    this.trigger("on:tick");

    if (useRAF) window.requestAnimationFrame( this.tick );
    else window.setTimeout(this.tick, this.tickInterval);

    return ticks;
  };
  
  var buildDefaultEvents = function() {
    // You would think that a programmer would iterate an array to make these.
    events.nominal["on:tick"] = [];

    events.nominal["on:start"] = [];
    events.nominal["after:start"] = [];

    events.nominal["on:pause"] = [];

    events.nominal["on:resume"] = [];

  };
  // trigger's any .on() or .at() events
  var triggerOrdinalEvents = function() {

    var time = ~~elapsedSeconds,
        eot = events.ordinal[ time ]; //readability

    if ( events.ordinal[ time ] === undefined ) return false;
    
    for (var _x = 0, _xx = eot.length; _x < _xx; _x++) {

      var fn = eot[_x].fn,
          ctx = eot[_x].context,
          args = eot[_x].args;

      fn.apply(ctx, args);

    }
    // so it won't trigger the next ticks that round down to this time, delete it.
    delete events.ordinal[time];
    
    return true;
  };

  var triggerLoopEvents = function() {

    var now = ~~elapsedSeconds;
    var expired = [];

    for (var key in events.loops) {

      var loop = events.loops[ key ]

      if (loop.check(now) &&          // Check whether the loop should fire at the current time
          loop.lastCalled !== now &&  // Check if it has already fired during this second
          loop.start <= now &&        // Check if it is 'allowed' to start.
          loop.delete === false) {    // Check if it is to be deleted
          
          // there is a reference to _this_ inside of loop,
          // so sending the loop itself as context is enough.
          loop.calledAt.push(now);
          loop.now = now;
          loop.fn.apply(loop, loop.args);
          loop.lastCalled = now;
          loop.calls++; 
      }
      // check whether it has expired
      if (loop.stop === now || loop.calls === loop.maxIntervals || loop.delete === true) {
        // put it in the box where bad loops go.
        expired.push( key );
      }
    }

    // Delete any loops marked
    for (var i = 0, ii = expired.length; i < ii; i++) {
      var name = expired[i];
      delete events.loops[name];
    }
  };


  /* Bindings */

  this.tick = tick.bind(this);
  var triggerLoopEvents = triggerLoopEvents.bind(this);
  var  triggerCurrentEvents = triggerOrdinalEvents.bind(this);
  



  /* * * * * * * * * * * * * * API * * * * * * * * * * * * * */


  /* Clock-related methods */


  this.pause = function() {
    running = false;
    this.trigger("on:pause");
    return this;
  };

  this.reset = function(){

    //reset event lists
    events.nominal = {};
    events.ordinal = [];
    events.loops = {};

    buildDefaultEvents();

    //reset counters
    ticks = 0;
    this.startTime = startTime = 0;

    //boot up
    this.start();
    return this;
  };

  this.resume = function() {
    if (running === true) return this;
    running = true;
    this.tick();
    this.trigger("on:resume");
    return this;
  };

  this.start = function() {

    this.trigger("on:start");

    this.startTime = startTime = new Date().getTime();
    startSeconds = new Date().getSeconds();
    running = true;
    this.tick( new Date().getTime() );

    this.trigger("after:start");
    return this;
  }; 

  
  // if debug is true, log is automatically called each tick
  this.debug = false;

  this.log = function() {

    console.clear();

    console.log("ticks:", ticks);
    console.log("elapsed seconds:", elapsedSeconds);
    console.log("actual elapsed seconds:", realElapsedSeconds);
    console.log("delta:", delta);
    console.log("FPS:", ~~(ticks / elapsedSeconds));
  };

  this.elapsedTime = function(){return elapsedSeconds;};


  /* Event-related methods */
  
  this.trigger = function(eventName) {

    if (events.nominal[eventName] === undefined) return this;

    var l = events.nominal[eventName].length

    for (var _x = 0, _xx = l; _x < _xx; _x++) {

      // wow, much length, many chars, such scary.
      var fn = events.nominal[eventName][_x].fn,
          ctx = events.nominal[eventName][_x].context,
          args = events.nominal[eventName][_x].args;

      fn.apply(ctx, args);

    }
    return this;
  };

  this.on = function(eventName, fn /* [, args, context ] */) {

    var context = arguments[3] || this, args = arguments[2] || [];

    // create an array for the event
    events.nominal[eventName] = events.nominal[eventName] || []

    var scope = this; // all events default to the scope of the Timeline object.

    events.nominal[eventName].push({
      'fn': fn,
      'args': args,
      'context': context
    });
    return this;
  };

  this.at = function( elapsedSeconds, fn /* [, args, context ] */) {

    var context = arguments[3] || null, args = arguments[2] || this;

    events.ordinal[elapsedSeconds] = events.ordinal[elapsedSeconds] || [];
    events.ordinal[elapsedSeconds].push({
      "fn":fn,
      "context":context,
      "args": args
    });

    return this;
  };

  this.loop = function(uniqueName, fn, args, scope ) {

    if (!uniqueName) return this;

    var self = this,
        defaults = { "start": ~~elapsedSeconds, "stop": Infinity, "interval": 9999, "maxIntervals": Infinity, "duration": 0, "calledAt": [] },
        required = { "name":uniqueName, "fn": fn, "calls": 0, "parent":self, "args": args || [] };

    // the loop object
    var Loop = function(options) {

      extend(this, defaults, required);
      // the check to determine if the loop is called
      this.check = function(time) {
        var start = this.start,
            interval = this.interval,
            duration = this.duration;

        if ( ( (time  -  start) )  % (interval + duration) === 0 ) return true;
        else return false;
      };

      this.for = function(options) {
        extend(this, options);
        return this.parent;
      };

      this.delete = false;
      return this;
    };
    var l = new Loop();

    events.loops[ l.name ] = l;

    return l;

  };

  this.after = function(seconds, fn /* [, args, context ] */) {
    var args = arguments[2], context = arguments[3];
    this.at(elapsedSeconds + seconds, fn, args, context);
  };

  this.remove = function(event) {

    if (typeof event === "number") {

      if (events.ordinal[event] === undefined) return {"removed":false, "ctx": this};

      delete events.ordinal[event];
      return {"removed":true, "ctx": this};
    }

    if (typeof event === "string") {

      // if it is a event set with on():
      if (events.nominal[eventName] === undefined) {

        //if it is a loop event 
        if (events.loops[eventName] === undefined) return {"removed":false, "ctx": this};

        // loops terminate themselves automatically when set to delete
        events.loops[eventName].delete = true;
        return {"removed":true, "ctx": this};
      }

      delete events.nominal[eventName];
      return {"removed":true, "ctx": this};
    } 
  };

  this.defer = function(fn){
    // waits for the current stack to clear
    window.setTimeout(0, fn)
  };


  if (options.bindToFunction === true) {

      var _t = this; // reference, since wait is in the context of the function

      var wait = function(seconds, args, context) {
        _t.after(seconds, this, args, context);
      };
      
      Function.prototype.wait = wait;
  }

  if (options.autostart === true) this.start();
  else return this;
};
 

var timeline = new Timeline({autostart:true, bindToFunction: true});

window.timeline = timeline; // for pausing in the console


// timed event testing

//timeline.at(2, function() {console.log(this); this.pause(); }, [], timeline);

// timed loop test
var test = function(){
  // stuff
};
var times = {
  "start": 2,
  "interval": 5,
  "stop": 10,
  "maxIntervals":3,
  "duration": 2
};

timeline.loop("test", test).for( times );


}(this));
