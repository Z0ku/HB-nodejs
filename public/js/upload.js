function upload(input,type){
  var files = $(input).get(0).files;
  var formData = new FormData();
  formData.append('newFile',files[0],files[0].name);
  $.ajax({
    url: '/upload'+type,
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function(data){
        console.log('upload successful!');
    }
  });
}
function uploadPic(input,img,type,id){
  var files = $(input).get(0).files;
  var formData = new FormData();
  formData.append('newPic',files[0],files[0].name);
  $.ajax({
    url: '/upload'+type,
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function(data){
        console.log('upload successful!');
        $(img).prop('src', '/img/profile_pics/'+id+ '?' + Math.random());
    }
  });
}
function previewFile(input,target) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            $(target).attr('src', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
}
