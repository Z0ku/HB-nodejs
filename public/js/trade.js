$('#tradeForm').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget); // Button that triggered the modal
  var item_id = button.data('id');
  var modal = $(this);

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
    }
  });
});
