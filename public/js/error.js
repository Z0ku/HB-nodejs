/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).ready(function(){

});
    function showError(result,elem){
        $(".error").html(result.replace('#', ''));
        $(".error").css("opacity","0");
        $(".error").animate({
          opacity: '1'
        },200);
    }
    function clearError(elem){
        $(elem).html("");
    }
    String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
