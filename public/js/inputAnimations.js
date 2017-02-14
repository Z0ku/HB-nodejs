/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function(){

    $("input , select ").on("focus",function(){
         $(this).animate({
            'opacity': '1' 
         },80); 
        });
    $("input , select").on("focusout",function(){
         $(this).animate({
            'opacity': '0.6' 
         },80); 
         markError(this);
    });
    function markError(E){
        if($(E).hasClass("req")){
             var T = $.trim($(E).val());
             if(T === ""){
                $(E).parent().addClass("has-error");
             }else{
                $(E).parent().removeClass("has-error");
             }
         }
    }
});