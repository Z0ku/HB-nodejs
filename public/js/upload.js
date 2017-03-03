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
function uploadPic(input,img,id){
  var files = $(input).get(0).files;
  var formData = new FormData();
  formData.append(id,files[0],files[0].name);
  $.ajax({
    url: '/upload',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function(data){
        console.log('upload successful!');
        $(img).prop('src', id+ '?' + Math.random());
    }
  });
}
function uploadBackPic(input,id){
  var files = $(input).get(0).files;
  var formData = new FormData();
  formData.append(''+id,files[0],files[0].name);
  $.ajax({
    url: '/upload',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function(data){
        console.log('upload successful!');
        window.location.reload();
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
