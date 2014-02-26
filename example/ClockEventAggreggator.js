

(function(window, undefined) {

    /*  Request Animation polyfill  */
    //  http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/


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


  var ClockEventAggreggator = function(args) {

    /* Helpers */

    // Helper for merging objects
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

    var isArray = function(thing){
      // assume 'thing' is not undefined or null as it will throw a TypeError.
      if (typeof thing === "string") return false;
      if ((thing).length === undefined) return false;
      else return true; 
    }


    /*  Timeline related variables  */

    var defaults = {useRAF: true, tickInterval: 16, autostart: false},
        options = extend(defaults, args),
        ticks = 0,
        lastTick = 0,
        startTime = 0,

        // the 'clock' time, calculated with delta and clockSpeed variables.
        elapsedTime = 0,

        // id for requestAnimationFrame
        rAFID = null,

        // whether this is every other tick
        tick_n = false,

        // the amount of real-time that has passed between ticks
        delta = 0,
        actualElapsedTime = 0;

        // fallback time for setTimeout
        this.tickInterval = options.tickInterval,

        running = false,

        // speed at which the clock runs
        clockspeed = 1,

        // reference
        self = this,

        // wether or not to use request Animation Frame
        useRAF = options.useRAF,

        // dynamic function for rAF or setTimeout functionality,
        tickCallee = function() {
          // set to start() initially in case called before start somehow.
          this.start();
        };

        
        


    /*  Event Aggregator related variables  */

    var events = {};
        events.nominal = {};
        events.ordinal = {};
        events.loops = {};

    
    /*  Internal Functions */

    //  clock's tick mechanism
    var tick = function() {
      
      var now = new Date().getTime(); //cache
      if (!running) return;
      
      ticks += 1 * clockspeed;
      tick_n = !tick_n;
      if (this.debug && tick_n) this.log();

      
      this.delta = delta = (now - lastTick) * clockspeed;

      lastTick = now;

      elapsedTime += delta;

      actualElapsedTime = ( now - startTime );

      this.errorMargin = actualElapsedTime - elapsedTime; 


      // singular events take precedence over loop events.
      triggerCurrentEvents();
      triggerLoopEvents();

      this.trigger("tick");

      
      rAFID = tickCallee();

      return ticks;
    };
    
    var buildDefaultEvents = function() {

      var defaultEvents = ["tick", "start", "after:start", "pause", "resume"],
          addEvent = function(name){

            events.ordinal[name] = [];
          };

      defaultEvents.forEach(addEvent);

    };
    buildDefaultEvents();

    var triggerOrdinalEvents = function() {

      var now = ~~(elapsedTime / 100) * 100;

      if ( events.ordinal[ now ] === undefined ) {return false;}  // return false in case of checks

      
      var eot = events.ordinal[ now ];

      // events.ordinal will be an array, so loop over each function in it.
      for (var _x = 0, _xx = eot.length; _x < _xx; _x++) {

        var fn = eot[_x].fn,
            ctx = eot[_x].context,
            args = eot[_x].args;

        fn.apply(ctx, args);
      }

      // delete it, so that it won't trigger the next ticks that round down to this time.
      delete events.ordinal[ now ];

      return true; // return true in case of checks
    };

    var triggerLoopEvents = function() {

      var now = ~~elapsedTime;

      var expired = [];

      for (var key in events.loops) {

        var loop = events.loops[ key ]

        if (loop.start <= now &&          // Check if it is 'allowed' to start.
            loop.checkInterval( now ) &&  // Check whether the loop should fire at the current time
            loop.delete === false ) {      // Check if it is to be deleted
            
            // there is a reference to _this_ inside of loop,
            // so sending the loop itself as context is enough.
            loop.calledAt.push( now );
            loop.now = now;
            
            loop.fn.apply( loop, loop.args );
            
            loop.lastCall = now;
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


    /*  Bindings  */

    this.tick = tick.bind(this);
    var triggerLoopEvents = triggerLoopEvents.bind(this);
    var  triggerCurrentEvents = triggerOrdinalEvents.bind(this);
    


    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /* * * * * * * * * * * * *   API   * * * * * * * * * * * * */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


    /*  Clock-related methods  */

    this.start = function() {

      if (running === true) { return this; } // simple tests to prevent multiple starts

      // tickLoop is a dynamically constructed function to remove an 'if' statement inside of tick() .
      var tickLoop;  

      if (useRAF === true) {
        tickLoop = new Function(" var id = window.requestAnimationFrame( this.tick ); return id;");
      }
      else {
        tickLoop = new Function(" var id = window.setTimeout(this.tick, this.tickInterval);return id;" );
      }
      // bind into this context
      tickCallee = tickLoop.bind(this);

      this.trigger("before:start");

      var now = new Date().getTime();
      this.startTime = startTime = now;
      running = true;
      lastTick = now;
      this.tick();

      this.enablePauseOnBlur();
      this.trigger("start");

      return this;
    }.bind(this);

    this.stop = function(){

      running = false;
      //reset event lists
      events.nominal = {};
      events.ordinal = [];
      events.loops = {};

      buildDefaultEvents();

      //reset counters
      ticks = 0;
      elapsedTime = 0;
      this.startTime = startTime = 0;

      return this;
    }.bind(this);

    this.reset = function(){

      this.reset();
      this.start();
      return this;
    }.bind(this);

    this.pause = function() {
      running = false;
      this.trigger("pause");
      return this;
    }.bind(this);

    this.resume = function() {
      if (running === true) return this;
      running = true;
      lastTick = new Date().getTime();
      this.tick();
      this.trigger("resume");
      return this;
    }.bind(this);

    this.clockScalar = function(multiplier) {
      // a relative way to affect the clock
      clockspeed *= multiplier || 1;
    };

    this.setClockSpeed = function(value) {
      // for manually entering a speed value
      clockspeed = value || clockspeed;
    };

    this.enablePauseOnBlur = function() {
      // called on start
      // requestAnimationFrame natively pauses onblur, but, this clock doesn't
      // so I've programmed the functionality into it. 

      window.onblur = function(){self.pause();}
      window.onfocus = function(){self.resume();};
    };

    this.disablePauseOnBlur = function(){
      window.onblur = function(){return null};
      window.onfocus = function(){return null};
    };
    
    this.ticks = function(){ return ticks; };

    this.milliseconds = function(){ return elapsedTime;};

    this.seconds = function(){ return elapsedTime / 1000 ; };

    this.minutes = function(){ return (this.seconds() / 60); };

    this.debug = options.debug || false;

    // if debug is true, log is automatically called each tick
    this.log = function() {

      console.clear();
      if (useRAF) console.log("<Using requestAnimationFrame>");
      else console.log("<Using setTimeout>");
      console.log("ticks:", ticks);
      console.log("delta:", delta);
      console.log("lastTick(should change)", ~~lastTick)
      console.log("elapsed time:", elapsedTime / 1000);
      console.log("elapsed seconds:", ~~(elapsedTime / 1000));
      console.log("actual elapsed time:", actualElapsedTime / 1000);
      console.warn("%cdifference (in seconds): " + (this.errorMargin / 1000), "color: #a00" );
      console.log("Ignore differences if you have called pause at any time.");
      console.log("Estimated FPS:", ~~(ticks / ( elapsedTime / 1000 )));
    };

    this.time = this.now = function(){ return elapsedTime; };



    /*  Event-related methods  */
    
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

    this.on = function( eventName, fn /* [, args, context ] */ ) {

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

    this.at = function( elapsedMS, fn /* [, args, context ] */ ) {
      if (elapsedMS === undefined) {throw new Error("at() method requires a clock-time passed in as first parameter."); return;}
      if (fn === undefined) {throw new Error("at() method requires a function passed in as second parameter."); return;}

      var context = arguments[3] || null, args = arguments[2] || this;

      var addTime = function( time ) {

        var t = time.toString();
        events.ordinal[ time ] = events.ordinal[ time ] || [];
        events.ordinal[ time ].push({
          "fn": fn,
          "context": context,
          "args": args
        });

      };

      if ( !isArray(elapsedMS) ) {
        addTime( elapsedMS );
        
        return this;

      }

        elapsedMS.forEach( addTime );


        return this;
    };

    this.after = function( milliseconds, fn /* [, args, context ] */ ) {
      var args = arguments[2], context = arguments[3];
      this.at( elapsedTime + milliseconds, fn, args, context );
    };

    this.loop = function( uniqueName, fn, args, scope ) {

      /*
          this.loop() returns a new loop object, which to alter timing-related options
          you call it's .for() method. 
          
          EX:
          var x = this.loop(*args).for(*args);
      */

      if (!uniqueName) return this;

      var self = this,
          defaults = {
            "autostart": true,
            "start": ~~elapsedTime,
            "stop": Infinity, 
            "interval": Infinity, 
            "maxIntervals": Infinity, 
            "duration": 0, 
            "calledAt": [],
            "startDelay": 0
          },
          required = {
            "name":uniqueName,
            "fn": fn,
            "calls": 0,
            "parent":self,
            "args": args || []
          };

      // the loop object that will be returned
      var Loop = function(options) {


        extend(this, defaults, required);

        // the check to determine if the loop is called
        this.checkInterval = function(now) {
          var start = this.start,
              interval = this.interval,
              duration = this.duration,
              doesIntervalMatchNow = (now - (start + this.startDelay))  % (interval + duration),
              intervalHasPassed = now - (this.lastCall === undefined ? start : this.lastCall);
    

          console.clear();
          console.log("name:", this.name);
          console.log("Delta:", self.delta );
          console.log("-----");
          console.log("start:", start);
          console.log("doesIntervalMatchNow", doesIntervalMatchNow);
          console.log("interval:", interval);
          console.log("now:", now);
          console.log("lastCall'ed:", this.lastCall);
          
          if ( doesIntervalMatchNow >= 0 && doesIntervalMatchNow <= delta && (now - this.lastCall) > (interval*0.99) ) return true;
          else return false;
        };

        this.for = function(options) {
          extend(this, options);
          this.lastCall = this.start - this.interval;
          return this;
        };

        this.delete = false;
        return this;
      };
      var l = new Loop();

      events.loops[ l.name ] = l;

      return l;
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

    this.getEvents = function() {
      // in case someone wants to view the internally set events
      return events;
    };

    /* * * * * * * * * * * * * *

      bindToFunction:

      Attach 'wait' method to the Function.prototype,
      delegating to the timeline's <this>.after() method.
      Useful? Could be. Invasive of global prototypes? Def.

    * * * * * * * * * * * * * */
    
    if (options.bindToFunction === true) {

        var _t = this; // reference, since wait is in the context of the callee

        var wait = function(seconds, args, context) {
          _t.after(seconds, this, args, context); 
        };
        
        Function.prototype.wait = wait;
    }

    if (options.autostart === true) this.start();
    else return this;
  };
   

  window.ClockEventAggreggator = ClockEventAggreggator;

}(this));