var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var session = require('express-session');
var app = express();
var mysql = require('mysql');
var crypto = require('crypto');
var util = require('util');
var nodemysql = require('node-mysql'); //FIGURE OUT!!!
var MySQLStore = require('express-mysql-session')(session);



var options = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hb_db'
};

var sessionStore = new MySQLStore(options);
app.locals.itemConds = {
        Good: 'primary',
        Mint: 'success',
        Acceptable : 'warning',
        Worn : 'danger'
    };

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

function makeConditions(query,connection){
  var cond = "";
  var condArr = [];
  var i = 0;
  for(var key in query){
    condArr[i] = connection.format(" ?? = ? ",[key,query[key]]);
    i++;
  }
  cond = condArr.join('AND ');
  return cond;
}
function makeValues(query){
  var vals = [];
  var i = 0;
  for(var key in query){
    vals[i] = mysql.format('?',query[key]);
    i++;
  }
  return vals.join(',');
}

function makeJoinConditions(query,connection){
  var J = " ";
  for(var i = 0;i < query.length;i++){
    var table = query[i];
    switch(table[2]){
      case "J":
        J += table[0]+" "+table[1]+" ON ";break;
      case "C":
        J += table[0]+"="+table[1]+" ";break;
      case "V":
        J += table[0]+"="+connection.format("?",table[1])+" ";break;
    }
  }
  return J;
}
function exists(query,table,res,callback){
  pool.getConnection(function(err,connection){
     if(!err){
  //     console.log('connected as id ' + connection.threadId);
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
      //  console.log('connected as id ' + connection.threadId);
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
      // console.log('connected as id ' + connection.threadId);
      var J = makeJoinConditions(query,connection);
      connection.query("SELECT "+col+" FROM "+table+""+J+cond,function(err,rows){
        if(err){
          console.log(err);
          console.log("SELECT "+col+" FROM "+table+""+J+cond);
          return callback(false);
        }else{
        //  console.log("SELECT "+col+" FROM "+table+""+J+cond);
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
      //  console.log('connected as id ' + connection.threadId);
       var vals = makeValues(query);
       connection.query("INSERT INTO "+table+" VALUES("+vals+")",function(err,result){
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
function update(query,table,conds,callback){
  pool.getConnection(function(err,connection){
     if(!err){
  //     console.log('connected as id ' + connection.threadId);
       var vals = makeConditions(query,connection);
       var cond = makeConditions(conds,connection);
       connection.query("UPDATE "+table+" SET "+vals+" WHERE "+cond,function(err,result){
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
function uploadFile(req,res){
  var form = new formidable.IncomingForm();
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/public');
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
      var query = [['LEFT JOIN','items',"J"],['collections.coll_id','items.coll_id',"C"]];
      getQueryDataJoin(query,"WHERE collections.user_id="+req.params.id+" GROUP BY collections.coll_id",'collections','collections.*,count(items.item_id) as itemCount',
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
var fullTradeData = "trades.trade_id,trades.user_id as trader_id,trades.item_id,trades.tradeStatus"+
                    ",items.itemName,collections.user_id as owner_id"+
                    ",collections.collName,trader.username as traderName"+
                    ",owner.username as ownerName "+
                    ",tradingStatus.ownerStatus,tradingStatus.traderStatus";

var fullTradeQuery = [
  ["JOIN ","items","J"],
  ["items.item_id","trades.item_id","C"],
  ["JOIN","collections","J"],
  ["collections.coll_id","items.coll_id","C"],
  ["LEFT JOIN","users as trader", "J"],
  ["trader.user_id","trades.user_id","C"],
  ["LEFT JOIN" ,"users as owner","J"],
  ["owner.user_id ","collections.user_id","C"],
  ["LEFT JOIN ","tradingStatus", "J"],
  ["trades.trade_id","tradingStatus.trade_id","C"],
];
app.get('/collection/:collId',function(req,res){
  var query = [['JOIN','users',"J"],['users.user_id','collections.user_id',"C"]];
  var collId = parseInt(req.params.collId);
  getQueryDataJoin(query,"WHERE collections.coll_id="+collId,'collections','collections.*,users.username,users.user_id'
  ,function(data){
    if(data){
      getQueryData({coll_id:req.params.collId,itemStatus:'Active'},"items","*",res,function(items){
        res.render('collection',{session:req.session,collId:collId,collData:data[0],I:items});
      })
    }
  })
});
app.get('/item/:id',function(req,res){
  var item = [['JOIN','collections',"J"],['items.coll_id','collections.coll_id',"C"]];
  getQueryDataJoin(item,"WHERE items.item_id="+req.params.id,"items","items.*,collections.coll_id as cColl_id,collections.collName as cCollName,collections.user_id as user_id",function(data){
    if(data){
      getQueryData({user_id:data['user_id']},"users","username",res,function(userData){
        res.render('item',{session:req.session,itemData:data[0],user:userData[0]});
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
app.post('/upload',function (req, res){
  uploadFile(req,res);
});
app.post('/addCollection',function (req, res){
  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '/public/img/collection_pics/');
  form.parse(req, function(err, fields, files) {
      var newColl = {coll_id:'',
                     user_id:fields.user_id,
                     collName:fields.collName,
                     collDesc:fields.collDesc,
                     dateStarted:''
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
app.get('/searchUserItems/:id',function(req,res){
  pool.getConnection(function(err,connection){
    if(!err){
      console.log('connected as id ' + connection.threadId);
      var query = "SELECT items.item_id,items.itemName,items.quantity,collections.coll_id,collections.collName "+
                  "FROM items JOIN collections ON collections.coll_id=items.coll_id WHERE ( LOWER(items.itemName) "+
                  "LIKE LOWER('%"+req.query.q+"%') OR LOWER(items.itemType) "+
                  "LIKE LOWER('%"+req.query.q+"%') )"+
                  "AND collections.user_id="+req.params.id+" AND items.itemStatus='Active'";
      connection.query(query,function(err,rows){
        if(err){
          console.log(err);
          res.send(err);
        }else{
          res.render('comp/searchItems',{data:rows});
        }
      });
    }else{
      console.log(err);
      res.send(err);
    }
  });
});
app.post('/updateCollDesc',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    update({collDesc:fields.collDesc},'collections',{coll_id:fields.coll_id},function(data){
      if(data){
        res.send('success');
      }
    })
  });
});
app.get('/getItem',function(req,res){
  getQueryData(req.query,'items','*',res,function(data){
    if(data){
      res.json(data[0]);
    }
  });
});
app.post('/addNewTrade',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req,function(err,fields,files){
    insertFull(fields.data,'trades',res,function(data){
      if(data){
        for(var i = 0;i < fields.items.length;i++){
          fields.items[i].push(data.insertId);
          insertFull(fields.items[i],'tradeItems',res,function(data){
          });
        }
      }
    });
  });
});
app.post('/acceptTrade',function(req,res){
  var form = new formidable.IncomingForm
  form.parse(req, function(err, fields, files){
    update({tradeStatus:'Currently Trading'},"trades",{trade_id:fields.trade_id},function(updateCheck){
      if(updateCheck){
          var newTradeStatus = {trade_id:fields.trade_id,
                                ownerStatus:'Not Received',
                                traderStatus:'Not Received'
                               };
          insertFull(newTradeStatus,"tradingStatus",res,function(check){
            if(check){
              res.send('Accepted Trade');
            }
          });
      }
    });
  });
});
app.get('/tradeOffer',function(req,res){
  if(req.session.loginUserId){
    var query = [
      ["JOIN","items","J"],
      ["items.item_id","tradeItems.item_id","C"],
    ];
    var conds = "WHERE tradeItems.trade_id="+req.query.id;
    getQueryDataJoin(query,conds,"tradeItems","tradeItems.*,tradeItems.item_id,items.itemName",function(tradeItems){
      getQueryData({trade_id:req.query.id},"trades","*",res,function(tradeOffer){
        query = [
          ["JOIN","items","J"],
          ["items.item_id","trades.item_id","C"],
          ["JOIN","collections","J"],
          ["collections.coll_id","items.coll_id","C"]
        ];
        getQueryDataJoin(query,"WHERE trade_id="+req.query.id,"trades","collections.user_id",function(owner){
          res.render('comp/viewOffer',{session:req.session,tradeItems:tradeItems,tradeOffer:tradeOffer[0],owner:owner[0].user_id});
        })
      });
    });
  }else{
    res.redirect('/login');
  }
});
app.get('/tradeOptions',function(req,res){
  var conds = "WHERE trades.trade_id = "+req.query.trade_id;
  getQueryDataJoin(fullTradeQuery,conds,"trades",fullTradeData,function(trade){
    if(trade.length != 0){
      res.render('comp/tradeOptions',{session:req.session,trade:trade[0]});
    }else{
      res.send('DELETED');
    }
  });
});

app.get('/confirmReceive',function(req,res){
  var conds = "WHERE tradingStatus.trade_id = "+req.query.trade_id;
  getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData,function(trade){
    var query = (req.session.loginUserId == trade[0].trader_id)?{'traderStatus':'Received'}:{'ownerStatus':'Received'};
     update(query,"tradingStatus",req.query,function(updateCheck){
       res.send('Confirmed');
     });
  });
});
app.get('/cancelTrade',function(req,res){
  var conds = "WHERE trades.trade_id = "+req.query.trade_id;
  getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData,function(trade){
    var query = (req.session.loginUserId == trade[0].trader_id)?{'traderStatus':'Canceled'}:{'ownerStatus':'Canceled'};
     update(query,"tradingStatus",req.query,function(updateCheck){
       res.send('Trade Canceled');
     });
  });
});
app.get('/trades',function(req,res){
  if(req.session.loginUserId){

    var conds = "WHERE collections.user_id="+req.session.loginUserId+" AND trades.tradeStatus='Offer'";
    getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData,function(tradeOffers){
      conds = "WHERE trades.user_id="+req.session.loginUserId+" AND trades.tradeStatus='Offer'";
      getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData,function(userOffers){

        conds = "WHERE (trades.user_id="+req.session.loginUserId+" OR collections.user_id="+req.session.loginUserId+") AND trades.tradeStatus='Currently Trading'"
        getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData,function(trading){
          res.render('trades',{session:req.session,tradeOffers:tradeOffers,userOffers:userOffers,trading:trading});
        });
      });
    });

  }else{
    res.redirect('/login');
  }
});
app.listen(80);
