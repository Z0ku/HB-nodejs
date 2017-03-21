var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var session = require('express-session');
var app = express();
var mysql = require('mysql');
var crypto = require('crypto');
var util = require('util');
// var nodemysql = require('node-mysql'); //FIGURE OUT!!!
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
  connectionLimit : 150,
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hb_db',
  debug    :  false
});
var keys = {
  items : 'item_id',
  users : 'user_id',
  trades : 'trade_id',
  collections : 'coll_id'
}
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
    condArr[i] = (query[key] == '')?key+'= null':connection.format(" ?? = ? ",[key,query[key]]);
    i++;
  }
  cond = condArr.join('AND ');
  return cond;
}
function makeValues(query){
  var vals = [];
  var i = 0;
  for(var key in query){
    vals[i] = (query[key] == '')?'null':mysql.format('?',query[key]);
    i++;
  }
  return vals.join(',');
}

function makeJoinConditions(query,connection){
  var J = " ";
  var condFlag = 0;
  var and = '';
  for(var i = 0;i < query.length;i++){
    var table = query[i];
    switch(table[2]){
      case "J":
        J += table[0]+" "+table[1]+" ON ";
        condFlag = 0;break;
      case "C":
        and = (condFlag == 1)?'AND ':'';
        J += and+table[0]+"="+table[1]+" ";
        condFlag = 1;break;
      case "V":
        and = (condFlag == 1)?'AND ':'';
        J += and+table[0]+"="+connection.format("?",table[1])+" ";
        condFlag = 1;break;
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

      //       console.log("SELECT * FROM "+table+" WHERE "+cond);
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
        //         console.log("SELECT "+col+" FROM "+table+" WHERE "+cond);

                 return callback(rows);
               }
           }else{
             console.log(err);
             console.log("SELECT "+col+" FROM "+table+" WHERE "+cond);
             return callback(false);
           }
         });
     }else{
       console.log(err);
       return callback(false);
     }
  });
}
function deleteCol(query,table,res,callback){
  pool.getConnection(function(err,connection){
     if(!err){
      //  console.log('connected as id ' + connection.threadId);
       var cond = makeConditions(query,connection);
       connection.query("DELETE FROM "+table+" WHERE "+cond,function(err,data){
           connection.release();
           if(!err){
               return callback(data);

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
             console.log("INSERT INTO "+table+" VALUES("+vals+")");
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
             console.log("UPDATE "+table+" SET "+vals+" WHERE "+cond);
             return callback(false);
           }else{
        //     console.log("UPDATE "+table+" SET "+vals+" WHERE "+cond);

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
    // console.log(file);
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
  var favCollectionsJoin = [
    ["JOIN","collections","J"],
    ["collections.coll_id","fav_collections.coll_id","C"],
    ["JOIN","users","J"],
    ["collections.user_id","users.user_id","C"]
  ];

  getQueryData(user,"users",'*',res,function(data){
    if(data){
      var joinCond = "WHERE fav_collections.user_id = "+user.user_id;
      getQueryDataJoin(favCollectionsJoin,joinCond,"fav_collections","fav_collections.*,collections.collName,users.username",function(favColls){
        res.render('profile',{session:req.session,tab:0,user:data[0],favColls:favColls});
      });
    }else{
      res.redirect('/notFound');
    }
  });
});
app.get('/users/:id/collections',function(req,res){
  var user = {user_id:req.params.id};
  getQueryData(user,'users','*',res,function(data){
    if(data){
      var query = [['LEFT JOIN','items',"J"],['collections.coll_id','items.coll_id',"C"]];
      var conds = "WHERE collections.user_id="+req.params.id+" GROUP BY collections.coll_id ORDER BY collections.collName ASC";
      getQueryDataJoin(query,conds,'collections','collections.*,count(items.item_id) as itemCount',
                       function(collection){
        if(collection){
          res.render('profile',{session:req.session,tab:1,user:data[0],colls:collection});
        }else{
          res.send("ERROR");
        }
      });
    }else{
        res.redirect('/notFound');

    }
  });
});


var fullTradeData = "trades.trade_id,trades.user_id as trader_id,trades.item_id,trades.tradeStatus,trades.dateSent"+
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

app.get('/users/:id/tradehistory',function(req,res){
  var user = {user_id:req.params.id};
  getQueryData(user,'users','*',res,function(data){
    if(data){
      var conds = "WHERE (trades.user_id="+data[0].user_id+" OR collections.user_id="+data[0].user_id+") AND trades.tradeStatus='Completed' ORDER BY trades.dateSent DESC"
      getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData,function(tradeOffers){
        res.render('profile',{session:req.session,tab:2,user:data[0],tradeHistory:tradeOffers});
      });
    }else{
      res.redirect('/notFound');
    }
  });
});

app.get('/collection/:collId',function(req,res){
  var query = [
    ['JOIN','users',"J"],
    ['users.user_id','collections.user_id',"C"],
    ['LEFT JOIN','fav_collections','J'],
    ['fav_collections.coll_id','collections.coll_id',"C"],
    ['fav_collections.user_id',(req.session.loginUserId)?req.session.loginUserId:'',"V"]
  ];
  var collId = parseInt(req.params.collId);
  var q = (req.query.q)?" AND LOWER(items.itemName) LIKE LOWER("+mysql.format("?","%"+req.query.q+"%")+")":"";
  getQueryDataJoin(query,"WHERE collections.coll_id="+collId,'collections','collections.*,users.username,users.user_id,count(fav_collections.coll_id) as checkFav'
  ,function(data){
    if(data[0].coll_id){
      getQueryDataJoin([],"WHERE coll_id="+req.params.collId+" AND itemStatus='Active'"+q,"items","*",function(items){
        res.render('collection',{session:req.session,collId:collId,collData:data[0],I:items,success:req.query.success,q:req.query.q});
      })
    }else{
      res.redirect('/notFound');
    }
  })
});
// Dont really need this for now
// app.get('/fullTrade',function(req,res){
//   var id = "WHERE trade_id = "+req.query.trade_id;
//   getQueryDataJoin(fullTradeQuery,id,"trades",fullTradeData,function(tradeData){
//     if(tradeData){
//       var tradeItemQuery = [
//         ["JOIN","items","J"]
//       ];
//       getQueryDataJoin(tradeItemQuery,id,"trades","trades.*,items.name",function(tradeItems){
//         res.send('comp/fullTrade',{session:req.session,tradeData:tradeData,tradeItems:tradeItems});
//       });
//     }else{
//       res.send("Trade Not Found");
//     }
//   });
// });

app.get('/item/:id',function(req,res){
  var item = [
  ['JOIN','collections',"J"],
  ['items.coll_id','collections.coll_id',"C"],
  ['JOIN','users',"J"],
  ['collections.user_id','users.user_id',"C"]
];
  var id = "WHERE items.item_id="+req.params.id;
  getQueryDataJoin(item,id,"items","items.*,collections.collName,collections.user_id,users.username",function(data){
    if(data[0]){
      getQueryDataJoin(fullTradeQuery,'WHERE trades.item_id = '+req.params.id+" AND trades.tradeStatus = 'Offer' ","trades",fullTradeData,function(itemOffers){
        getQueryData({user_id:data['user_id']},"users","username",res,function(userData){
          res.render('item',{session:req.session,itemData:data[0],user:userData[0],itemOffers:itemOffers});
        });
      });
    }else{
      res.redirect('/notFound');
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
app.post('/deleteItem',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req,function(err,fields,files){
    update({itemStatus:'Deleted'},'items',fields,function(data){
      if(data.affectedRows == 1){
        update({tradeStatus:'Declined'},"trades",{item_id:fields.item_id,tradeStatus:'Offer'},function(check){});
        getQueryData(fields,'tradeItems','trade_id',res,function(trades){
          for(var i = 0;i < trades.length;i++){
            deleteCol({trade_id:trades[i].trade_id,tradeStatus:'Offer'},"trades",res,function(trade){});
          }
        });
        res.send('This item has been deleted.');
      }else{
        res.send('Error when Deleting this Item.');
      }
    });
  });
});
app.post('/deleteCollection',function(){
  var form = new formidable.IncomingForm();
  form.parse(req,function(err,fields,files){
    var id = {coll_id:fields.id};
    getQueryData(id,"items","item_id",res,function(items){
        for(var i = 0;i < items.length;i++){
          update({itemStatus:'Deleted'},'items',{item_id:items[i].item_id},function(data){
            if(data.affectedRows == 1){
              update({tradeStatus:'Declined'},"trades",{item_id:items[i].item_id,tradeStatus:'Offer'},function(check){});
              getQueryData({item_id:items[i].item_id},'tradeItems','trade_id',res,function(trades){
                  for(var i = 0;i < trades.length;i++){
                    deleteCol({trade_id:trades[i].trade_id,tradeStatus:'Offer'},"trades",res,function(trade){});
                  }
                });
              }
          });
        }
    });
  });
});
app.post('/update',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req,function(err,fields,files){
    var updateData = fields;
    update(updateData.col,updateData.table,{[keys[updateData.table]]:updateData.id},function(response){
      if(response.affectedRows == 1){
        res.send('success');
      }else{
        res.send('ERROR');
      }
    });
  });
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
app.get('/search',function(req,res){
  var query = mysql.format("?","%"+req.query.q+"%");
  var cond = " WHERE items.itemStatus=\"Active\" AND ( LOWER(items.itemName) "+
               "LIKE LOWER("+query+") OR LOWER(items.itemType) "+
               "LIKE LOWER("+query+") ) ORDER BY items.itemName ASC";
  var join = [
    ["JOIN","collections","J"],
    ["collections.coll_id","items.coll_id","C"]
  ];

  getQueryDataJoin(join,cond,"items","items.*,collections.user_id",function(items){
    join = [
      ["JOIN","users","J"],
      ["collections.user_id","users.user_id","C"]
    ];
    cond = "WHERE LOWER(collections.collName) LIKE LOWER("+query+") ORDER BY collections.collName ASC";
    getQueryDataJoin(join,cond,"collections","collections.*,users.username",function(colls){
      cond = "WHERE LOWER(username) LIKE LOWER("+query+")";
      getQueryDataJoin([],cond,"users","*",function(users){
        res.render('comp/searchResults',{session:req.session,I:items,colls:colls,users:users});
      });
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
        res.send('succes');
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
// rating system
// app.get('/rate',function(req,res){
//   req.query.user_id = req.session.loginUserId;
//   exists({id:req.query.id,type:req.query.table,user_id:req.session.loginUserId},'ratings',res,function(check){
//     if(check){
//       update({rating:req.query.rating},"ratings",res,function(data){
//         res.json({added:true});
//       });
//     }else{
//       insertFull(req.query,'ratings',res,function(data){
//         res.json({added:false});
//       });
//     }
//   });
// });


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
          insertFull(fields.items[i],'tradeItems',res,function(data){});
        }
        res.send('success');
      }
    });
  });
});
app.post('/acceptTrade',function(req,res){
  var form = new formidable.IncomingForm
  form.parse(req, function(err, fields, files){
    update({tradeStatus:'Currently Trading'},"trades",{trade_id:fields.trade_id,tradeStatus:'Offer'},function(updateCheck){
      if(updateCheck.affectedRows > 0){
          var newTradeStatus = {
                                trade_id:fields.trade_id,
                                ownerStatus:'Not Received',
                                traderStatus:'Not Received'
                               };
          insertFull(newTradeStatus,"tradingStatus",res,function(check){
            if(check){
              res.send('Accepted Trade');
            }
          });
      }else{
        res.send('Trade was already canceled');
      }
    });
  });
});
app.post('/declineTrade',function(req,res){
  var form = new formidable.IncomingForm;
  form.parse(req,function(err,fields,files){
    update({tradeStatus:'Declined'},"trades",{trade_id:fields.trade_id},function(updateCheck){
        res.send('Trade Declined');

    });
  });
});
app.post('/favoriteCollection',function(req,res){
  var form = new formidable.IncomingForm;
  form.parse(req,function(err,fields,files){
    var fav = {coll_id:fields.coll_id,user_id:fields.user_id};
    if(fields.action == 'add'){
      insertFull(fav,'fav_collections',res,function(check){});
    }else{
      deleteCol(fav,'fav_collections',res,function(check){});
    }
  });
});

app.get('/tradeOffer',function(req,res){
//  if(req.session.loginUserId){
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
  //}else{
    //res.redirect('/login');
  //}
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
  getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData+',trades.tradeQuantity',function(trade){
    var query = (req.session.loginUserId == trade[0].trader_id)?{'traderStatus':'Received'}:{'ownerStatus':'Received'};
    if(trade[0].traderStatus != 'Canceled' && trade[0].ownerStatus != 'Canceled'){
     update(query,"tradingStatus",req.query,function(updateCheck){
       if(updateCheck){
         if(trade[0].traderStatus == 'Received' || trade[0].ownerStatus == 'Received'){
           query = {item_id:trade[0].item_id};
           getQueryData(query,"items","quantity",res,function(itemQuant){
            //  console.log(itemQuant[0]);
             var quant = itemQuant[0].quantity;
             var tradeQuant = trade[0].tradeQuantity;
            //  console.log(trade);
             var newQuant = quant - tradeQuant;
             update({quantity:newQuant},"items",{item_id:trade[0].item_id},function(check){

             });
          });
           getQueryData({trade_id:req.query.trade_id},"tradeItems","item_id,itemQuant",res,function(tradeItems){
             for(var i = 0;i < tradeItems.length;i++){
               var tradeItem = tradeItems[i];
               getQueryData({item_id:tradeItem.item_id},"items","quantity",res,function(data){
                 var quant = data[0].quantity;
                 var tradeQuant = tradeItem.itemQuant;
                 query = {item_id:tradeItem.item_id};
                 update({quantity:(quant - tradeQuant)},"items",query,function(check){
                   console.log(check);
                 });
               });
              }
             });
          update({tradeStatus:'Completed'},"trades",{trade_id:req.query.trade_id},function(data){
            res.send("Trade Complete");

          });
       }else{
         res.send('Confirmed');
       }
     }
     });
   }else{
     res.send('Trade was already Canceled!');
   }
  });
});
app.get('/cancelOffer',function(req,res){ // Work on this
  // console.log(req.query);
  deleteCol({trade_id:req.query.trade_id,tradeStatus:'Offer'},"trades",res,function(check){
    if(check.affectedRows > 0){
      deleteCol(req.query,"tradeItems",res,function(data){});
      res.send('Offer Canceled');
    }else{
      res.send('Offer has already been accepted/declined.')
    }
  });
});
app.get('/cancelTrade',function(req,res){
  var conds = "WHERE trades.trade_id = "+req.query.trade_id;
  getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData,function(trade){
    var query = (req.session.loginUserId == trade[0].trader_id)?{'traderStatus':'Canceled'}:{'ownerStatus':'Canceled'};
    if(trade[0].traderStatus != 'Received' && trade[0].ownerStatus != 'Received'){
     update(query,"tradingStatus",req.query,function(updateCheck){
       if(trade[0].traderStatus == 'Canceled' || trade[0].ownerStatus == 'Canceled'){
         query = {trade_id:req.query.trade_id};
         deleteCol(query,"tradeItems",res,function(data){});
         deleteCol(query,"tradingStatus",res,function(data){});
         deleteCol(query,"trades",res,function(data){});
       }
       res.json({success:'Trade Canceled'});
     });
   }else{

     res.json({error: 'You cannot cancel this trade since the other user has already received his trade.'});
   }
  });
});
app.get('/trades',function(req,res){
  if(req.session.loginUserId){

    var conds = "WHERE collections.user_id="+req.session.loginUserId+" AND trades.tradeStatus='Offer'";
    getQueryDataJoin(fullTradeQuery,conds,'trades',fullTradeData,function(tradeOffers){
      conds = "WHERE trades.user_id="+req.session.loginUserId+" AND (trades.tradeStatus='Offer' OR trades.tradeStatus = 'Declined')";
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
app.get('*',function(req,res){
    res.render('notFound.ejs',{session:req.session});
});

app.listen(81);
