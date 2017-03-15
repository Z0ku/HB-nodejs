$('#tradeForm').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget); // Button that triggered the modal
  var item_id = button.data('id');
  var modal = $(this);
  curr_trade = item_id;
  if(sessUser != -1){
    $.ajax({
      url:'/getItem',
      type:'GET',
      data:{item_id,item_id},
      success: function(data){
        for(var col in data){
          modal.find('.'+col).text(data[col]);
        }
        var itemPic = modal.find('.itemHeadPic').children('img');
        $(itemPic).attr('src','/img/item_pics/'+item_id+'?'+Math.random());
        modal.find('#tradeQuantity').attr('max',data.quantity);
      }
    });
  }else{
    event.preventDefault();
    alert('Login or Register to Start Trading.');
     window.location.href = '/login';
  }
});
$(document).on('click','.addTradeItem',function(){
  var itemId = $(this).data('itemid');
  var exists = false;
  $('.tradeItemRow').each(function(){
    if($(this).data('itemid') == itemId){
      exists = $(this);
    }
  });
  if(exists == false){
    var item = $(this).parent().parent();
    var tradeItemName = $(item).find('.itemName').text();
    var maxQuant = $(item).find('.quantity').text();
    var delTradeButton = "<button class='delTrade btn btn-danger'>X</button>"
    $('#tradeItems').append(
      "<tr class='tradeItemRow'  data-itemid='"+itemId+"'>"+
        "<td class='tradeItemName'>"+tradeItemName+"</td>"+
        "<td><input class='tradeQuant' type='number' value='1' min='1' max='"+maxQuant+"'></td>"+
        "<td>"+delTradeButton+"</td>"+
      "</tr>"
    )
  }else{
    var itemQuant = parseInt(exists.find('.tradeQuant').val())+1;
    exists.find('.tradeQuant').val(itemQuant);
  }
});
$(document).on('click','.delTrade',function(){
  $(this).parent().parent().remove();
});
