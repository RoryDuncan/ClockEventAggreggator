

var example = function(){

  var canvas = document.getElementById("renderExample"),
      ctx = canvas.getContext("2d"),
      pi = 22 / 7;

      canvas.width = canvas.height = 700;
      
      var center = {
        x: canvas.width / 2,
        y: canvas.height / 2
      };


  var render = function(){

    var ticksHand = function(){
      var radius = canvas.width * 0.4;
      console.log();
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 , canvas.height / 2 );
      ctx.fillStyle = "#fff";
      ctx.fillRect(0,0,canvas.width, canvas.height);

      ctx.lineWidth = 3;
      var x = radius * Math.cos( timeline.ticks() / 2 ) + center.x,
          y = radius * Math.sin( timeline.ticks() / 2 ) + center.y;
      ctx.strokeStyle = "#088";
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    var secondsHand = function() {

      var radius = canvas.width * 0.4;

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 , canvas.height / 2 );

      ctx.strokeStyle = "#f44";
      ctx.lineWidth = 5;

      var x = center.x + ( radius * Math.cos( timeline.seconds() + center.x )),
          y = center.y + ( radius * Math.sin( timeline.seconds() + center.y ));
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    var minutesHand = function() {

      var radius = canvas.width * 0.4;

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 , canvas.height / 2 );

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 8;

      var x = center.x + ( radius * Math.cos((timeline.seconds() / 60) + center.x )),
          y = center.y + ( radius * Math.sin((timeline.seconds() / 60) + center.y ));
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    ticksHand();
    secondsHand();
    minutesHand();
  };

  timeline.on("tick", render);

};
example();
