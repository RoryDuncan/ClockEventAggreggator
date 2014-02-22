
// Learning how ClockEventAggreggator works?
// This file is going to have commentary on everything.

/*** If you're just looking for ClockEventAggreggator's usage, it is used on line 109 ***/

  var clock = new ClockEventAggreggator({useRAF:true, debug:false});

    clock.start();

console.log("Example of https://github.com/RoryDuncan/ClockEventAggreggator/")
// a wrapper
var example = function() {

  // get the canvas from the DOM
  var canvas = document.getElementById("renderExample"),

      // and the context, ctx is easier to type
      ctx = canvas.getContext("2d"),

      // pi, with some extra decimals
      pi = 22 / 7;

      // fixed size
      canvas.width = canvas.height = 700;
      
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
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

      var x = center.x + ( radius * Math.cos(( clock.seconds() / 60) + center.x )),
          y = center.y + ( radius * Math.sin(( clock.seconds() / 60) + center.y ));
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

    //console.log("%cRENDERS", "background-color: #88c; padding: 1px 5px; color: #fff; border-radius: 10px; font-size: 10px; font-weight: bold; position:");
    //console.log(clock.seconds() )
    updateTicksHand();
    updateSecondsHand();
    updateMinutesHand();
    adjustClockSpeed();


  };


  // use the ClockEventAggreggator's "on" method
  clock.on("tick", render);

};

// call the function we wrapped.
example();
