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
    window.location.href = window.location.href;
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
var userSearchThread;
$('#userItemSearch').on('keyup',function(){

    var searchItems = $(this).siblings('.searchDrop');
    var query = $(this).val();
    clearInterval(userSearchThread);
    if($(this).val() == ""){
      $(searchItems).hide();
    }else{
    userSearchThread = setTimeout(function(){

      $(searchItems).show();
      $.ajax({
        url:'/searchUserItems/'+sessUser,
        type: "GET",
        data:{q:query},
        success:function(data){
          $(searchItems).html(data);
        },
      });
    },500);
  }
});

setInterval(function(){
  $('.tradeOptions').each(function(){
    var trade_id = $(this).data('id');
    var T = $(this);
    $.ajax({
      url:'/tradeOptions',
      type: "GET",
      data:{trade_id:trade_id},
      success: function(data){
        if(data !== "DELETED"){
          T.parent().html(data);
        }else{
          T.parent().parent().remove();
        }
      }
    });
  });
},3000);

$("#sendTradeOffer").on('click',function(){
  var tradeData;
  tradeData = [7];
  tradeData[0]= '';
  tradeData[1] = curr_trade;
  tradeData[2]= sessUser;
  tradeData[3] = $('#tradeQuantity').val();
  tradeData[4] = 'Offer';
  tradeData[5] = parseFloat($('#priceOffer').val());
  tradeData[6] = $('#tradeDesc').val();

  var tradeItems = [];
  $('.tradeItemRow').each(function(index){
    var tradeItem  = [];
    tradeItem.push($(this).data('itemid'));
    tradeItem.push($(this).find('.tradeQuant').val());
    tradeItems.push(tradeItem);
  });

  var newTrade = {
    data:tradeData,
    items:tradeItems
  }
  $.ajax({
    url: '/addNewTrade',
    type:"POST",
    data:JSON.stringify(newTrade),
    contentType: "application/json"
  })

});
$('.offerBtn').on('click',function(){
  var id = $(this).data('id');
  curr_offer = id;
  $.ajax({
    url: '/tradeOffer',
    type: 'GET',
    data:{id:id},
    success:  function(data){
      $('#viewOffer').find('.modal-body').html(data);
    }
  })
});

$(document).on('click','#acceptTrade',function(){
  $.ajax({
    url:'/acceptTrade',
    type:"POST",
    data:JSON.stringify({trade_id:curr_offer,ownerId:sessUser}),
    contentType: "application/json",
    succes: function(result){
      alert(result);
    },
    error: function(result){
      alert(result);
    }
  });
});
function disableBtn(btn){
  btn.prop('disabled',true);
}
$(document).on('click','.confirm',function(){
    disableBtn($(this));
    disableBtn($(this).siblings('.cancelTrade'));
    $(this).append('<span class="glyphicon glyphicon-ok"></span>');
    var id = $(this).data('id');
    $.ajax({
      url:'/confirmReceive',
      type: 'GET',
      data: {trade_id:id},
      success: function(data){
        alert(data);
      }
    });
});
$(document).on('click','.cancelTrade',function(){
  if(confirm('Are you sure you wish to cancel this trade?')){
      $(this).parent().parent().remove();
      var id = $(this).data('id');
      $.ajax({
        url:'/cancelTrade',
        type: 'GET',
        dataType: 'json',
        data: {trade_id:id}
      });
    }
});
