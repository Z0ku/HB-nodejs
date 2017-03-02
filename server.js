var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');      //File System - for file manipu
var session = require('express-session');
var app = express();
var mysql = require('mysql');
var crypto = require('crypto');
var util = require('util');
var MySQLStore = require('express-mysql-session')(session);

var options = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hb_db'
};

var sessionStore = new MySQLStore(options);

app.use(session({
  store:sessionStore,
  secret: 'keyboard cat',
  resave: false,saveUninitialized:false,
  }));

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
});
function md5HashString(str){
  var md5HashSum = crypto.createHash('md5');
  md5HashSum.update(str);
  return md5HashSum.digest('hex');
}
function checkConn(err,connection,callback){
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
    condArr[i] = ""+key+"="+connection.escape(query[key])+" ";
    i++;
  }
  cond = condArr.join('AND ');
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
function makeJoinConditions(query,connection){
  var J = " ";
  var i = 0;
  for(var table in query){
    if(table.toString().search('JOIN') === -1){
      J += table+"="+query[table]+" ";
      i++;
    }else{
      J += table+" "+query[table]+" ON ";
    }
  }
  return J;
}
function exists(query,table,res,callback){
  pool.getConnection(function(err,connection){
     if(!err){
       console.log('connected as id ' + connection.threadId);
       var cond = makeConditions(query,connection);
       connection.query("SELECT * FROM "+table+" WHERE BINARY "+cond,function(err,rows){
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
     if(!err){
       console.log('connected as id ' + connection.threadId);
       var cond = makeConditions(query,connection);
       connection.query("SELECT "+col+" FROM "+table+" WHERE "+cond,function(err,rows){
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
     }else{
       console.log(err);
       return callback(false);
     }
  });
}
function getQueryDataJoin(query,cond,table,col,callback){
  pool.getConnection(function(err,connection){
    if(!err){
      console.log('connected as id ' + connection.threadId);
      var J = makeJoinConditions(query,connection);
      connection.query("SELECT "+col+" FROM "+table+""+J+cond,function(err,rows){
        if(err){
          console.log(err);
          return callback(false);
        }else{
          return callback(rows);
        }
      });
    }else{
      console.log(err);
      return callback(false);
    }
  });
}
function insertFull(query,table,res,callback){
  pool.getConnection(function(err,connection){
     if(!err){
       console.log('connected as id ' + connection.threadId);
       var vals = makeValues(query,connection);
       connection.query("INSERT INTO "+table+" VALUES"+vals,function(err,result){
           connection.release();
           if(err){
             console.log(err);
             return callback(false);
           }else{
             return callback(result);
           }
         });
     }else{
       console.log(err);
       return callback(false);
     }
  });
}
String.prototype.replaceAll = function(search, replacement) {
var target = this;
return target.split(search).join(replacement);
};

function loginUser(username,userId,session){
  session.loginUser = username;
  session.loginUserId = userId;
  session.save();
}
function uploadFile(req,res,filePath){
  var form = new formidable.IncomingForm();
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/public'+filePath);
  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
  fs.rename(file.path, path.join(form.uploadDir,field));
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
  req.session.destroy();
  res.redirect('/login');
});
app.get('/users/:id',function(req,res){
  var user = {user_id:req.params.id};
  getQueryData(user,"users",'user_id,username',res,function(data){
    res.render('profile',{session:req.session,tab:0,user:{name:data[0].username,id:data[0].user_id}});
  });
});
app.get('/users/:id/collections',function(req,res){
  var user = {user_id:req.params.id};
  getQueryData(user,'users','user_id,username',res,function(data){
    if(data){
      var query = {'LEFT JOIN':'items','collections.coll_id':'items.coll_id','JOIN':'users','collections.user_id':data[0].user_id.toString()};
      getQueryDataJoin(query,"GROUP BY collections.coll_id",'collections','collections.*,count(items.item_id) as itemCount',
                       function(collection){
        if(collection){
          res.render('profile',{session:req.session,tab:1,user:{name:data[0].username,id:data[0].user_id},colls:collection});
        }else{
          res.send("ERROR");
        }
      });
    }else{

    }
  });
});
app.get('/collection/:collId',function(req,res){
  var query = {'JOIN':'users','users.user_id':'collections.user_id'};
  var collId = parseInt(req.params.collId);
  getQueryDataJoin(query,"WHERE collections.coll_id="+collId,'collections','collections.*,users.username,users.user_id'
  ,function(data){
    if(data){
      getQueryData({coll_id:req.params.collId},"items","*",res,function(items){
        res.render('collection',{session:req.session,collId:collId,collData:data[0],I:items});        
      })
    }
  })
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
app.post('/uploadProfilePic',function (req, res){
  uploadFile(req,res,'/img/profile_pics/');
});
app.post('/uploadBackPic',function (req, res){
  uploadFile(req,res,'/img/background_pics/');
});
app.post('/uploadCollPic',function (req, res){
  uploadFile(req,res,'/img/background_pics/');
});
app.post('/uploadCollBackPic',function (req, res){
  uploadFile(req,res,'/img/background_pics/');
});

app.post('/addCollection',function (req, res){
  var D = new Date();
  var curr_date = ""+D.getFullYear()+"-"+D.getMonth()+"-"+D.getDate();
  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '/public/img/collection_pics/');
  form.parse(req, function(err, fields, files) {
      var newColl = {coll_id:'',
                     user_id:fields.user_id,
                     collName:fields.collName,
                     collDesc:fields.collDesc,
                     dateStarted:curr_date
                   };
      insertFull(newColl,'collections',res,function(data){
        if(data){
          if(files.image){
            fs.rename(files['image'].path, path.join(form.uploadDir,data.insertId.toString()));
          }
          if(files['bg-image']){
            form.uploadDir = path.join(__dirname, '/public/img/collectionBack_pics/');
            fs.rename(files['bg-image'].path, path.join(form.uploadDir,data.insertId.toString()));
          }
          res.send(data.insertId.toString());
        }
      });
    });
});
app.post('/addItem',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    console.log(fields);
    insertFull(fields,'items',res,function(data){
      if(data){
        form.uploadDir = path.join(__dirname, '/public/img/item_pics/');
        if(files['itemPic']){
          fs.rename(files['itemPic'].path, path.join(form.uploadDir,data.insertId.toString()));
        }
      }
    });
  });
});
app.get('/registerUser',function(req,res){
  req.query['password'] = md5HashString(req.query['password']).toString();
  insertFull(req.query,'users',res,function(data){
    res.send('success');
  });

});
app.listen(80);
