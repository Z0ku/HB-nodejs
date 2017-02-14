var express = require('express');
//var session = require('express-session');
var bodyParser = require('body-parser');
var postData = bodyParser.urlencoded({extended: false});
var app = express();
var mysql = require('mysql');
var crypto = require('crypto');

//app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

//app.use(session({secret: 'ssshhhhh'}));

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
     }
  });
}

app.use(express.static('./public'));

app.set('view engine', 'ejs');

app.get('/', function(req, res){
  res.render('index');
});
app.get('/login', function(req, res){
  res.render('login');
});
app.get('/checkUser',function(req,res){
   exists(req.query,"users",function(data){
     if(data){
       res.send('success');
     }else{
       res.send('#Invalid Username');
     }
   });
});
app.get('/confirmUser',function(req,res){
  var user = {username:req.query['username']};
  var inputPass = md5HashString(req.query['inputPass']).toString();
  getQueryData(user,"users","password",function(pass){
    if(pass[0].password === inputPass){
      res.send('success');
    }
  });
});

app.listen(8888);
