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

  if(files[0].type.split('/')[0] == 'image'){
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
  }else{
    alert("File is not an image.");
  }

}
function uploadBackPic(input,id){
  var files = $(input).get(0).files;
  var formData = new FormData();
  if(files[0].type.split('/')[0] == 'image'){
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
  }else{
    alert("File is not an image.");
  }
}
function previewFile(input,target) {
  if(input.files[0].type.split('/')[0] == 'image'){
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            $(target).attr('src', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
  }else{
    clearInputFile(input);
    console.log(input.files[0])
    alert('File is not an image.');
  }
}
function clearInputFile(f){
    if(f.value){
        try{
            f.value = ''; //for IE11, latest Chrome/Firefox/Opera...
        }catch(err){ }
        if(f.value){ //for IE5 ~ IE10
            var form = document.createElement('form'),
                parentNode = f.parentNode, ref = f.nextSibling;
            form.appendChild(f);
            form.reset();
            parentNode.insertBefore(f,ref);
        }
    }
}
