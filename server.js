var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var postData = bodyParser.urlencoded({extended: false});
var app = express();
var mysql = require('mysql');
var crypto = require('crypto');

app.use(session({ secret: 'keyboard cat',resave: false,saveUninitialized:false, cookie: { maxAge: 60000}}));

//app.set('views', __dirname + '/views');
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
  for(var key in query){
    cond += key+"="+connection.escape(query[key])+" ";
  }
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
function exists(query,table,callback){
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

             console.log(err);
             return callback(false);
           }
         })
     }else{
       console.log(err);
       return callback(false);
     }
  });
}
function getQueryData(query,table,col,callback){
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
function insertFull(query,table,callback){
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
function loginUser(username,session){
  session.loginUser = username;
}
app.use(express.static('./public'));

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
  res.render('login',{session:req.session});
});
app.get('/users/:name',function(req,res){
  res.render('profile',{session:req.session});
});
app.get('/checkElem',function(req,res){
   exists(req.query,"users",function(data){
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
  getQueryData(user,"users","password",function(pass){
    if(pass[0].password === inputPass){
      loginUser(req.query.username,req.session);
      res.send('success');
    }else{
      res.send('#Wrong Password');
    }
  });
});
app.get('/registerUser',function(req,res){
  req.query['password'] = md5HashString(req.query['password']).toString();
  insertFull(req.query,'users',function(data){

  });

});


app.listen(80);
