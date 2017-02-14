$(document).ready(function(){

  function hidePopup(){
    $(".pop-back").css("display","none");
  }

  $(".pop-back").on("click",function(e){
    if (e.target !== this){
      return;
    }else{
      hidePopup();
    }
  });

});
