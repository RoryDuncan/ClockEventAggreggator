console.clear();

/*  Request Animation polyfill.
    http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
*/
(function() {
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
}());



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
      running = false,
      useRAF = options.useRAF,
      elapsedSeconds = 0,
      realElapsedSeconds = 0;
      this.tickInterval = options.tickInterval;
      
  // Event Aggregator related variables
  var events = {};

  events.nominal = {};
  events.ordinal = [];
  events.loops = {};
  
  /*  Internal Functions */

  //  clock mechanism
  var tick = function() {

    if (!running) return;
    
    ticks++;
    if (this.debug) this.log();

    elapsedSeconds = (ticks * 16) / 1000;
    realElapsedSeconds = ( new Date().getTime() - startTime ) / 1000;

    // one-time events take precedence over loop events.
    triggerCurrentEvents();
    triggerLoopEvents();
    
    if (useRAF) window.requestAnimationFrame( this.tick );
    else window.setTimeout(this.tick, this.tickInterval);

    return ticks;
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
          loop.start <= now) {        // Check if it is 'allowed' to start.
          
          // there is a reference to _this_ inside of loop,
          // so sending the loop itself as context is enough.
          loop.fn.apply(loop, loop.args);
          loop.lastCalled = now;
          loop.calls++; 
      }
      // check whether it has expired
      if (loop.stop === now || loop.calls === loop.maxIntervals ) {
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
  

  /* API */


  this.elapsedTime = function(){return elapsedSeconds;};
  
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

  this.on = function(eventName, fn /* [, context, args ] */) {

    var context = arguments[2] || null, args = arguments[3] || this;

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

  this.at = function( elapsedSeconds, fn /* [, context, args ] */) {

    var context = arguments[2] || null, args = arguments[3] || this;

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
        defaults = { "start": ~~elapsedSeconds, "stop": Infinity, "interval": 9999, "maxIntervals": Infinity },
        required = { "name":uniqueName, "fn": fn, "calls": 0, "parent":self, "args": args || [] };

    // the loop object
    var Loop = function(options) {

      extend(this, defaults, required);
      // the check to determine if the loop is called
      this.check = function(time) {
        var start = this.start;
        var interval = this.interval;
        if ( (time - start) % interval === 0 ) return true;
        else return false;
      };

      this.for = function(options) {
        extend(this, options);
        return this.parent;
      };
      return this;
    };
    var l = new Loop();

    events.loops[ l.name ] = l;

    return l;

  };

  this.after = function(milliseconds, fn) {};
  
  this.pause = function() {
    running = false;
    return this;
  };

  this.reset = function(){

    //reset event lists
    events.nominal = {};
    events.ordinal = [];
    events.loops = {};

    //reset counters
    ticks = 0;
    this.startTime = startTime = 0;

    //boot up
    this.start();
    return this;
  };

  this.resume = function() {
    running=true;
    this.tick();
    return this;
  };

  this.start = function() {

    this.startTime = startTime = Date.now();
    running = true;
    this.tick();
    return this;
  }; 

  this.add = function(){};

  this.remove = function(eventName) {
    if (events.nominal[eventName] === undefined) return {"removed":false, "ctx": this};
    else delete events.nominal[eventName];

    return {"removed":true, "ctx": this};
  };
  
  this.push = function(){};

  this.pop = function(){};
  
  
  /* debug */
  this.debug = false;
  this.log = function() {

    console.clear();
    console.log("ticks:", ticks);
    console.log("elapsed seconds:", elapsedSeconds);
    console.log("FPS:", ~~(ticks / elapsedSeconds));
  };


  if (options.autostart === true) this.start();
  else return this;
};
 

var timeline = new Timeline({autostart:true});

window.timeline = timeline; // for pausing in the console


// timed event testing
timeline.at(3, function() { console.log("3 seconds of elapsed time."); });

// timed loop test
var test = function(x, y, z){ console.count("loop test");
console.log(x,y,z) };

console.log ( timeline.loop("test", test).for({"interval": 5, "maxIntervals":3}) );

