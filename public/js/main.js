$('.hasEdit').hover(function(){
  $(this).children('.editPic').show();
},function(){
  $(this).children('.editPic').hide();
}
);
$('.editPic').on('click','.btn',function(){
  $(this).siblings().click();
});
function logout(){
  $.ajax({
    url:'/logout'
  });
  window.location.href = window.location.href
}
$('.loader').bind('ajaxStart', function(){
    $(this).show();
}).bind('ajaxStop', function(){
    $(this).hide();
});
