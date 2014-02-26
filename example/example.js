
// Learning how ClockEventAggreggator works?
// This file is going to have commentary on everything.

/*** If you're just looking for ClockEventAggreggator's usage, it is used on line 109 ***/


  var clock = new ClockEventAggreggator({autostart:false, useRAF:true, debug:false}),
      start = document.getElementById("start"),
      stop = document.getElementById("stop"),
      pause = document.getElementById("pause"),
      resume = document.getElementById("resume"),
      render;

  

  // button controls
  start.addEventListener("click", function() {
    var count = 0;

    clock.at([2000, 4000 ], function(){ document.getElementById("debug").innerHTML += count + "<br />";count++; clock.pause()});
    clock.start();
    start.disabled = true;
    stop.removeAttribute("disabled");
    pause.removeAttribute("disabled");
    resume.removeAttribute("disabled");
    
    clock.on("tick", render);// "tick" is a built in event
  /*
    var loop = clock.loop("test", function(){

        var count = this.calledAt.length;
        document.getElementById("debug").innerHTML += "Loop " + (count-1) + " called at " + this.calledAt[count-1] + "ms<br />";


    }).for({"interval":1000, "maxIntervals":50});
  */
  
    
  });


  stop.addEventListener("click", function() {
    clock.stop();
    start.removeAttribute("disabled");
    stop.disabled = true;
    pause.disabled = true;
    resume.disabled = true;
  });


  pause.addEventListener("click", function() {
    clock.pause();
  });

  resume.addEventListener("click", function() {
    clock.resume();
  });


console.log("%cExample of http://github.com/RoryDuncan/ClockEventAggreggator/", "color:#aaa;");
// a wrapper


// get the canvas from the DOM
var canvas = document.getElementById("renderExample"),

    // and the context, ctx is easier to type
    ctx = canvas.getContext("2d"),

    // pi, with some extra decimals
    pi = 22 / 7;

    // fixed size
    canvas.width = canvas.height = 350;
    
    // create a 'center' object for ease-of-access.
    var center = {
      x: canvas.width / 2,
      y: canvas.height / 2
    };

// updateTicksHand updates the display of the 'hand' of the clock that represents ClockEventAggreggator's tick.
var updateTicksHand = function() {
    // set the radius to 40% of the canvas's width
    var radius = canvas.width * 0.4;


    // set a background rectangle
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    // start drawing a line from the center
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 , canvas.height / 2 );

    // thicken the line
    ctx.lineWidth = 3;

    // set the positions of the end of the line to the position of the circle radius relevant to ticks
    // note: timeline.
    var x = radius * Math.cos( clock.ticks() / 2 ) + center.x,
        y = radius * Math.sin( clock.ticks() / 2 ) + center.y;

    //set the tick hand's color
    ctx.strokeStyle = "#088";

    // draw the line
    ctx.lineTo(x, y);

    // stroke / fill it in
    ctx.stroke();
};

// the only difference between updateSecondsHand and updateTicksHand is the color and linewidth of the 'hand'
var updateSecondsHand = function() {

    var radius = canvas.width * 0.4;

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 , canvas.height / 2 );

    ctx.strokeStyle = "#f44";
    ctx.lineWidth = 5;

    var x = center.x + ( radius * Math.cos( clock.seconds() + center.x )),
        y = center.y + ( radius * Math.sin( clock.seconds() + center.y ));
    ctx.lineTo(x, y);
    ctx.stroke();
};

// the only difference between updateMinutesHand and updateTicksHand is the color and linewidth of the 'hand'
var updateMinutesHand = function() {

    var radius = canvas.width * 0.4;

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 , canvas.height / 2 );

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 8;

    var x = center.x + ( radius * Math.cos(( clock.minutes() ) + center.x )),
        y = center.y + ( radius * Math.sin(( clock.minutes() ) + center.y ));
    ctx.lineTo(x, y);
    ctx.stroke();
};

var adjustClockSpeed = function(){
  var input = document.getElementById("clockspeed").value;
  document.getElementById("clockvalue").innerHTML = input;
  clock.setClockSpeed(input);

};

  // render is the wrapper that will call the uodates


  var render = function() {
  
  var ms = ~~(clock.milliseconds() % 1000),
      secs = ~~clock.seconds(),
      mins = ~~clock.minutes(),
      hours = ~~(clock.minutes() % 60);

  var time = hours + ":" + mins + ":" + secs + ":" + ms;

  updateTicksHand();
  updateSecondsHand();
  updateMinutesHand();
  adjustClockSpeed();

  document.getElementById("time").innerHTML = "CLOCK: " + time + "<br />";


};
render();

// use the ClockEventAggreggator's "on" method
clock.on("tick", render);

// call the function we wrapped.

