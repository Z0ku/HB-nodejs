var editOptions = {
  'itemCondition':[
    'Good',
    'Acceptable',
    'Mint',
    'Worn'
  ]
};
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
// $(document).ready(function () {
//     $(document).ajaxStart(function () {
//         $("#loading").show();
//     }).ajaxStop(function () {
//         $("#loading").hide();
//     });
// });
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
var mainSearchInterval;
$('#mainSearchBar').on('keyup',function(){
  clearInterval(mainSearchInterval); // reset timer
  var searchVal = $(this).val();
  var title = $(this).parent().siblings('h2');
  $('#mainSearchResults').html("");
  mainSearchInterval = setTimeout(function(){ // start timer
    if(searchVal !== ""){

      $('#searchContainer').animate({
          'margin-top': '25px'
      },200);
      title.hide();
      $.ajax({
        url:'/search',
        type: "GET",
        data: {q:searchVal},
        success :function(results){
          $('#mainSearchResults').html(results);
        }
      });
      $('#mainSearchResults').show();
    }else{
      $('#searchContainer').animate({
          'margin-top': '200px'
      },200);
      title.show();
      $('#mainSearchResults').hide();
    }
  },500); // time before searching
  

});

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
  tradeData[7] = '';

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

var valToEdit;
var inputType;
$(document).on("dblclick",'.toEdit',function(){
  $('#editor').parent().html(valToEdit);
  valToEdit = $(this).text();
  inputType = $(this).data('type');
  var vals = "id='editor' class='form-control' ";
  var editor;
  var optValues;
  var finishBtn = '</br></br><button class="btn btn-primary finishEdit">Finish Edit</button> &nbsp;';
  var cancelBtn = '<button class="btn btn-danger cancelEdit">Cancel</button></br>'
  if(inputType !== 'textarea' && inputType !== 'select'){
    editor = "<input type='"+inputType+"' "+vals+" value='"+valToEdit+"'>";
  }else if(inputType == 'textarea'){
    editor =  "<"+inputType+" "+vals+" cols='50'>"+valToEdit+"</"+inputType+">";
  }else if(inputType == 'select'){
    var options = "";
    optValues = $(this).data('col');
    for(var i = 0; i < editOptions[optValues].length;i++){
      options += "<option value="+editOptions[optValues][i]+">"+editOptions[optValues][i]+"</option>"
    }
    editor = "<"+inputType+" "+vals+">"+options+"</"+inputType+">";
  }
  $(this).html(editor+finishBtn+cancelBtn);
});
$(document).on('click','.cancelEdit',function(){
  $('#editor').parent().html(valToEdit);
});
$(document).on('click','.finishEdit',function(){
  var newVal = $('#editor').val();
  var validInput = 1;
  var col = $('#editor').parent();

  if(inputType == 'number'){
    newVal = parseInt(newVal);
    if(isNaN(newVal)){
      validInput = 0;
    }
  }
  if($('#editor').parent().data('restrict')){
    var restriction = $('#editor').parent().data('restrict');
    if(restriction == 'float'){
      if(newVal.trim() != '' && !$('#editor').hasClass('must-fill')){
        newVal = parseFloat(newVal);
        if(isNaN(newVal)){
          validInput = 0;
        }
      }else{
        newVal = newVal.trim();
      }
    }
  }
  if($("#editor").parent().hasClass('must-fill') && inputType != 'number' && newVal.trim() == ''){
    validInput = 0;
  }
  if(validInput == 1){
    var table = $('#editTable').val();
    var id = $('#editTable').data('id');
    var toUpdateData = {id:id,table:table,col:{[col.data('col')]:newVal}};
    $.ajax({
      url: '/update',
      type: 'POST',
      data: JSON.stringify(toUpdateData),
      contentType: "application/json",
      context:'#editor',
      success: function(response){
        $('#editor').parent().html(newVal);
      },
      error: function(response){
        alert(response);
      }
    });
  }else{
    alert('Invalid Input');
  }
});
$(document).on('click','#acceptTrade',function(){
  if(confirm('Accept this Offer?')){
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

    window.location.href =  window.location.href;
  }
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
      context:this,
      success: function(data){
        alert(data);
        if(data == "Trade Complete" || data == 'Trade was already Canceled!'){
          $(this).parent().parent().parent().remove();
        }
      }
    });
});
$(document).on('click','.cancelOffer',function(){
  if(confirm('Are you sure you wish to cancel this offer?')){
    var id = $(this).data('id');
    $.ajax({
      url:'/cancelOffer',
      type:"GET",
      data:{trade_id:id},
      success: function(response){
        alert(response);
      }
    });
    $(this).parent().parent().parent().remove();
  }
});
$('.delItem').on('click',function(){
  if(confirm("Are you sure you wish to delete this item from your colletion?")){
    var id = $(this).data('id');
    $.ajax({
      url: '/deleteItem',
      type: 'POST',
      data: {item_id:id},
      success: function(response){
        alert(response);
        window.location.href = window.location.href;
      }
    });
  }
});
$(document).on('click','.cancelTrade',function(){
  if(confirm('Are you sure you wish to cancel this trade?')){
      var id = $(this).data('id');

      $.ajax({
        url:'/cancelTrade',
        type: 'GET',
        dataType: 'json',
        data: {trade_id:id},
        context: this,
        success: function(response){
            alert(response);
            $(this).parent().parent().parent().remove();
        },
        error : function(response){
          alert('You cannot cancel this trade since the other user has already received his trade.');
          disableBtn($(this));
        }
      });
    }
});
