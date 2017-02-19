var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');      //File System - for file manipu
var session = require('express-session');
var bodyParser = require('body-parser');
var postData = bodyParser.urlencoded({extended: false});
var app = express();
var mysql = require('mysql');
var crypto = require('crypto');

app.use(session({ secret: 'keyboard cat',resave: false,saveUninitialized:false, cookie: { maxAge: 60*60000}}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

//app.use(session({secret: 'ssshhhhh'}));
//console.log(session);
var pool = mysql.createPool({
  connectionLimit : 100,
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hb_db',
  debug    :  false
})

function md5HashString(str){
  var md5HashSum = crypto.createHash('md5');
  md5HashSum.update(str);
  return md5HashSum.digest('hex');
}
function checkConn(err,connection){
  if (err) {
    res.json({"code" : 100, "status" : "Error in connection database"});
    return false;
  }
  console.log('connected as id ' + connection.threadId);
  return true;
}
function makeConditions(query,connection){
  var cond = "";
  var condArr = [];
  var i = 0;
  for(var key in query){
    condArr[i] = " "+key+"="+connection.escape(query[key])+"";
    i++;
  }
  cond = condArr.join('AND');
  return cond;
}
function makeValues(query,connection){
  var vals = "(";
  var valArr = [];
  var i = 0;
  for(var key in query){
    valArr[i] = connection.escape(query[key]);
    i++;
  }
  var max = i-1;
  for(i = 0;i < max;i++){
    vals += valArr[i]+",";
  }
  vals += valArr[i]+")";
  return vals;
}
function exists(query,table,res,callback){
  pool.getConnection(function(err,connection){
     if(checkConn(err,connection) == true){
       var cond = makeConditions(query,connection);
       connection.query("SELECT * FROM "+table+" WHERE "+cond,function(err,rows){
           connection.release();
           if(!err){
               if(rows.length <= 0){
                 return callback(false);
               }else{
                 return callback(true);
               }
           }else{

             console.log("SELECT * FROM "+table+" WHERE "+cond);
             return callback(false);
           }
         })
     }else{
       console.log(err);
       return callback(false);
     }
  });
}
function getQueryData(query,table,col,res,callback){
  pool.getConnection(function(err,connection){
     if(checkConn(err,connection) == true){
       var cond = makeConditions(query,connection);
       connection.query("SELECT "+col+" FROM "+table+" WHERE BINARY "+cond,function(err,rows){
           connection.release();
           if(!err){
               if(rows.length <= 0){
                 return callback(false);
               }else{
                 return callback(rows);
               }
           }else{
             console.log(err);
             return callback(false);
           }
         });
     }
  });
}
function insertFull(query,table,res,callback){
  pool.getConnection(function(err,connection){
     if(checkConn(err,connection) == true){
       var vals = makeValues(query,connection);
       connection.query("INSERT INTO "+table+" VALUES"+vals,function(err){
           connection.release();
           if(err){
             return callback(false);
           }else{
             return callback(true);
           }
         });
     }
  });
}
function loginUser(username,userId,session){
  session.loginUser = username;
  session.loginUserId = userId;
}
function uploadFile(req,res,filePath,filename){
  var form = new formidable.IncomingForm();
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/public'+filePath);
  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
  fs.rename(file.path, path.join(form.uploadDir,filename.toString()));
  });

  // log any errors that occur
  form.on('error', function(err) {
  console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
  res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);
};
//app.use(express.static('./public'));

app.set('view engine', 'ejs');

app.get('/', function(req, res){
  res.render('index',{session:req.session});
});
app.get('/login', function(req, res){
  res.render('login',{session:req.session});
});
app.get('/register', function(req, res){
  res.render('register',{session:req.session});
});
app.get('/logout',function(req,res){
  req.session.loginUser = false;
  req.session.loginUserId = false;
  res.render('login',{session:req.session});
});
app.get('/users/:name',function(req,res){
  var user = {username:req.params.name};
  getQueryData(user,"users",'user_id',res,function(data){
    res.render('profile',{session:req.session,tab:0,user:{name:user.username,id:data[0].user_id}});
  });
});
app.get('/users/:name/collections',function(req,res){
  var user = {username:req.params.name};
  getQueryData(user,'users','user_id',res,function(data){
    if(data[0].user_id){
      getQueryData({user_id:data[0].user_id},"collections","*",res,function(C){
        res.render('profile',{session:req.session,tab:1,user:{name:user.username,id:data[0].user_id},C:C});
      });
    }
  });
});
app.get('/checkElem',function(req,res){
   exists(req.query,"users",res,function(data){
     if(data){
       res.send('success');
     }else{
       res.send('fail');
     }
   });
});
app.get('/checkCollElem',function(req,res){

   exists(req.query,"collections",res,function(data){
     if(data){
       res.send('success');
     }else{
       res.send('fail');
     }
   });
});
app.get('/confirmUser',function(req,res){
  var user = {username:req.query['username']};
  var inputPass = md5HashString(req.query['inputPass']).toString();
  getQueryData(user,"users","password,user_id",res,function(pass){
    if(pass[0].password === inputPass){
      loginUser(req.query.username,pass[0].user_id,req.session);
      res.send('success');
    }else{
      res.send('#Wrong Password');
    }
  });
});
app.post('/uploadProfilePic',postData,function (req, res){
  uploadFile(req,res,'/img/profile_pics/',req.session.loginUserId);
});
app.post('/uploadBackPic',postData,function (req, res){
  uploadFile(req,res,'/img/background_pics/',req.session.loginUserId);
});
app.post('/uploadCollPic',postData,function (req, res){
  uploadFile(req,res,'/img/collection_pics/',req.session.loginUserId);
});
app.get('/addCollection',function (req, res){
  var D = new Date();
  var curr_date = ""+D.getFullYear()+"-"+D.getMonth()+"-"+D.getDate();
  var newColl = {coll_id:"",
                 user_id:req.query.user_id,
                 collName:req.query.collName,
                 collDesc:req.query.collDesc,
                 dateStarted:curr_date
                }
  insertFull(newColl,'collections',res,function(data){

  });
});
app.get('/registerUser',function(req,res){
  req.query['password'] = md5HashString(req.query['password']).toString();
  insertFull(req.query,'users',res,function(data){

  });

});
app.listen(88);
