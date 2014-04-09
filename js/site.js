$(function(){
  function hideEvalUI() {
    $(".eval-ui").hide();
    $("#eval-spinner").hide();
    $("#eval-target").html('Evaluating...');
    $(".eval-results").hide();
  }

  $(".eval").mouseenter(function () {
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
    setTimeout(function(){
      $.get("http://gosu-eval-service.herokuapp.com/eval", {
        "script" : txt
      }, function(results){
        $("#eval-spinner").fadeOut('fast');
        $("#eval-target").hide().html(results).fadeIn('fast');
      });
    }, 1000)
  });
});
