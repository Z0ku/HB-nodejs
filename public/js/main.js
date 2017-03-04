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
String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};
$('.loader').bind('ajaxStart', function(){
    $(this).show();
}).bind('ajaxStop', function(){
    $(this).hide();
});
