
var escapeElement = document.createElement('textarea');

function unEscape(html) {
  escapeElement.innerHTML = html;
  return escapeElement.textContent;
}

if($) {
  $(function(){

    $('body').append('<div class="eval-ui" style="font-family: \'Droid Sans\', sans-serif;position:absolute;z-index:10000;display:none;white-space: normal; border-radius:5px">' +
      '<div class="eval-btn btn btn-primary"> <i class="fa fa-play"></i> Eval Me... </div>' +
      '<div class="eval-results" style="background:#fbffaa;border: 1px solid #dcd965;margin-top:12px;display:none;; border-radius:5px">' +
      '  <div style="border-bottom: 1px solid #dcd965;padding: 4px 12px">' +
      '    <strong>Results</strong>' +
      ' <i id="eval-spinner" class="fa fa-spinner fa-spin"></i>' +
      ' </div>' +
      '<div id="eval-target" style="white-space:pre;padding:8px 12px;font-weight:normal">Evaluating...</div>' +
      '</div>' +
      '</div>');

    $('body').css('position', 'relative');

    function hideEvalUI() {
      $(".eval-ui").hide();
      $("#eval-spinner").hide();
      $("#eval-target").html('Evaluating...');
      $(".eval-results").hide();
    }

    $(".eval-gs").mouseenter(function () {
      $(".eval-ui")
        .css('top', $(this).offset().top + $(this).height() - 32)
        .css('left', $(this).offset().left + $(this).width() - 102)
        .data('target', $(this)[0])
        .fadeIn('fast');
    }).mouseleave(function (event) {
        if($(event.relatedTarget).closest(".eval-ui").length == 0) {
          hideEvalUI();
        }
      });

    $(".eval-ui").mouseleave(function(event){
      if(event.relatedTarget != $(this).data('target')) {
        hideEvalUI();
      }
    });

    $(".eval-btn").click(function(){
      $("#eval-spinner").show();
      $(".eval-results").fadeIn('fast');
      var txt = $($(".eval-ui").data('target')).children('span').text();
      txt = unEscape(txt)
      setTimeout(function(){
        $.get("http://gosu-eval-service.herokuapp.com/eval", {
          "script" : txt
        }, function(results){
          $("#eval-spinner").fadeOut('fast');
          $("#eval-target").hide().html(results).fadeIn('fast');
        });
      }, 1000)
    });
  })

} else {
  if(window.console) {
    window.console.log("eval-gosu.js requires JQuery!");
  }
}
