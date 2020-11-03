const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); //used for user authentication
const session = require('express-session')
const MongoStore = require ('connect-mongo')(session);
const moment = require('moment');
const nodemailer = require("nodemailer");

require('dotenv').config();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//settings for express-session module
app.use(session({
  cookie:{
    maxAge: 86400000, //24 hours
    path:'/'
  },
  resave: false,
  rolling: true, //renew session unless idle
  saveUninitialized: false,
  secret: 'DrPepper Cherries',
  store: new MongoStore({mongooseConnection:mongoose.connection})
}));

//settings for moment module
moment().format();

// Database ==========================================================
mongoose.connect(process.env.DB_URI2, {useNewUrlParser: true, useUnifiedTopology: true});

const foodItemSchema = new mongoose.Schema({
  "userId": String,
  "name": String,
  "calories": Number,
  "sodium": Number,
  "protein": Number,
  "carbs": Number,
  "fat": Number,
  "cholesterol": Number,
  "fiber": Number,
  "sugar": Number,
  "iron": Number,
  "vitA": Number,
  "vitC": Number,
  "vitD": Number,
  "vitE": Number,
  "calcium": Number,
  "potassium": Number,
  "zinc": Number
});

const itemDiarySchema = new mongoose.Schema({
  "userId": String,
  "date": Date,
  "item":{
    "name": String,
    "calories": Number,
    "sodium": Number,
    "protein": Number,
    "carbs": Number,
    "fat": Number,
    "cholesterol": Number,
    "fiber": Number,
    "sugar": Number,
    "iron": Number,
    "vitA": Number,
    "vitC": Number,
    "vitD": Number,
    "vitE": Number,
    "calcium": Number,
    "potassium": Number,
    "zinc": Number
  }
});

const userSchema = new mongoose.Schema({
  'name': String,
  'email': String,
  'password': String
})

const foodItem = mongoose.model('foodItem', foodItemSchema);
const itemDiary = mongoose.model('itemDiary', itemDiarySchema);
const user = mongoose.model('user', userSchema);

// Functions ==========================================================

const adjustTime = function(startDate, subtractHours){
  let adjustedTime = moment.utc(startDate).subtract(subtractHours,'hour');
  return(adjustedTime.toISOString());
}

const authenticateUser = function(email, password){
  let email = email.toLowerCase();
  return new Promise((resolve, reject)=>{
    user.find({'email': email}, (err, doc)=>{
      if(doc.length > 0 && doc.length != undefined){
        const userHash = doc[0].password;
        bcrypt.compare(password, userHash, (err, result)=>{
          if(result === true){
            resolve([true, doc[0].name, doc[0].id]);

          }else if(err){
            console.warn('ERROR_TED0: ' + err);
            resolve([false]);
          }else{
            resolve([false]);
          }
       });

      }else if(err){
        console.warn('ERROR_TED1: ' + err);
        resolve([false]);
      }else{
        resolve([false]);
      }
    });
  });
}

// Calculate nutrition totals
const calculateNutritionTotals = function(foodDiary){
  let cal = 0;
  let sdm = 0;
  let pro = 0;
  let crb = 0;

  foodDiary.forEach(element => {
    cal += (element.item.calories);
    sdm += (element.item.sodium);
    pro += (element.item.protein);
    crb += (element.item.carbs);
  });

  const totals = {
    "cal":cal,
    "sdm":sdm,
    "pro":pro,
    "crb":crb
  }
  return totals
}

// Return All User Food Items
const findFoodItems = function(userDocId){
    return new Promise((resolve, reject)=>{
      foodItem.find({userId:userDocId},(err, doc)=>{
      if(err){
        console.warn("ERROR at findFoodItems: " + err)
        reject(err);
      }else{
        resolve(doc);
      }
    });
  });
}

// Return usr diary items based on day
const findDiaryItems = function(userDocId, usrDay, timezoneOffset, orderedObjects){
  usrDayAdj = adjustTime(usrDay, timezoneOffset); //adjust time to user's timezone to determine day.
  startOfDay = (moment(usrDayAdj).startOf('day')).toISOString(); //get beginning of day
  endOfDay = (moment(usrDayAdj).endOf('day')).toISOString(); //get end of day
  //add timezone offset to start and end of day, since DB times are UTC.
  startOfDay = (moment(startOfDay).add(timezoneOffset, 'hours')).toISOString();
  endOfDay = (moment(endOfDay).add(timezoneOffset, 'hours')).toISOString();

  if(userDocId == undefined){
    console.warn("ERR: No User ID")
    return(false);
  }
  return new Promise((resolve, reject)=>{
    itemDiary.find({ //find diary items within date range for usrId
      userId:userDocId, 
      date:{$gte:startOfDay, $lte:endOfDay}
    }, (err, doc)=>{
      
      if(err){
        console.warn("ERROR at findDiaryItems")
      }else{
        doc.forEach(element => {
          let utcDate = element.date;
          //convert UTC date to user's local date
          let timezoneAdjustedDate = (moment(utcDate).subtract(timezoneOffset, 'hours')).toISOString();
          //convert military time to 12 hour time
          let twelveHourDate = moment(timezoneAdjustedDate).format('YYYY-MM-DDThh:mm:ss.SSS')
          //update JSON object with converted date
          element.date = twelveHourDate;
        });
        //return all diary items with adjusted date
        resolve([doc, orderedObjects]);
      }
    })
  })
}

//Order given array
const orderObjects = function(unorderedObjects){
  let valueChanged = false;

  if(unorderedObjects.length<0 || unorderedObjects == undefined){
    return []
  }

  while(valueChanged === false){
    valueChanged = true;
    for(let i=0; i<=unorderedObjects.length; i++){
      //end loop if nothing left to compare
      if(unorderedObjects[i+1] == undefined){
        break
      }
      let obj1 = unorderedObjects[i].name;
      let obj2 = unorderedObjects[i+1].name;

      if(obj1 > obj2){
        let item1 = unorderedObjects[i];
        let item2 = unorderedObjects[i+1];
        unorderedObjects.splice(i,2, item2, item1);
        valueChanged = false;
      }
    }
  } 
  return unorderedObjects; //this is now ordered
}

//Save New Item to Database
const addNewItem = function(newItems, userDocId){
  const item = new foodItem({
    "userId":userDocId,
    "name": newItems.itemName,
    "calories": newItems.calories,
    "sodium": newItems.sodium,
    "protein": newItems.protein,
    "carbs": newItems.carbs,
    "fat": newItems.fat,
    "cholesterol": newItems.cholesterol,
    "fiber": newItems.fiber,
    "sugar": newItems.sugar,
    "iron": newItems.iron,
    "vitA": newItems.vitA,
    "vitC": newItems.vitC,
    "vitD": newItems.vitD,
    "vitE": newItems.vitE,
    "calcium": newItems.calcium,
    "potassium": newItems.potassium,
    "zinc": newItems.zinc
  });
  return new Promise((resolve, reject)=>{
    item.save((err, doc)=>{
      if(err){
        reject(err);
      }else{
        resolve(doc);
      }
    });
  })};

  const addNewUser = function(name, email, pHashed){
    let email = email.toLowerCase();
    const newUser = new user({
      "name": name,
      "email": email,
      "password": pHashed
    });
    newUser.save((err,doc)=>{
      if(err){
        console.warn('Error Saving User: ' + err);
      }
    });
  }

  const addToDiary = function(userId, itemInfo){
    return new Promise((resolve, reject)=>{
      const item = new itemDiary({
        "userId": userId,
        "date": new Date().toISOString(),
        "item":{
          "name": itemInfo.name,
          "calories": itemInfo.calories,
          "sodium": itemInfo.sodium,
          "protein": itemInfo.protein,
          "carbs": itemInfo.carbs,
          "fat": itemInfo.fat,
          "cholesterol": itemInfo.cholesterol,
          "fiber": itemInfo.fiber,
          "sugar": itemInfo.sugar,
          "iron": itemInfo.iron,
          "vitA": itemInfo.vitA,
          "vitC": itemInfo.vitC,
          "vitD": itemInfo.vitD,
          "vitE": itemInfo.vitE,
          "calcium": itemInfo.calcium,
          "potassium": itemInfo.potassium,
          "zinc": itemInfo.zinc
        }
      });
        item.save((err, doc)=>{
          if(err){
            console.warn('Failed to save new diary item to DB');
            reject(err);
          }else if(doc){
            resolve("cats");
          }
        });
    })
  }

const checkForExistingUser = function(email){
  let email = email.toLowerCase();
  return new Promise((resolve, reject)=>{
    user.find({email:email}, (err, result)=>{
      console.log(result);
      if(result.length){
        resolve(true)
      }else if(err){
        console.warn("error checking for user: " + err);
      }else{
        resolve(false);
      }
    })
  })
}

  const duplicateDiaryItem = function(itemString){
    let parsedItem = JSON.parse(itemString);
    return new Promise((resolve, reject)=>{
      addToDiary(parsedItem.userId, parsedItem.item).then(()=>{
        resolve();
      })
    })
  }

 const removeFromDiary = function(itemId){
   return new Promise((resolve, reject)=>{
     itemDiary.deleteOne({_id:itemId}, (err)=>{
       if(err){
        reject("error removing item from diary: "+err);
       }else()=>{
         resolve();
       }
     })
   })
 }

  const checkForNewName = function(newName){
    if(newName != null && newName != 'undefined'){
      return newName;
    }else{
      return null
    }
  }

  const sendPassResetEmail = function(emailAddress){
    //email host information
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth:{
        user: process.env.gmailUsr,
        pass: process.env.gmailPass
      }
    });

      transporter.sendMail({
        from:'"TedCounter :)"<tedcounter@gmail.com>',
        to: emailAddress,
        subject:"HELLOO",
        test:"hello fine young customer",
        htm:"<b>This is a test body.<b>"
      });
  }


// Get Requests ==========================================================
app.get(['/','/oops', '/accountCreated'], (req, res)=>{
  if(req.originalUrl === '/oops'){
    res.render('index', {toastAction: "showFailedToast"})
  }else if(req.originalUrl === '/accountCreated'){
    res.render('index', {toastAction:"showAccountCreatedToast"});
  }else{
    res.render('index', {toastAction:"hideToast"});
  }
});

app.get('/dashboard', (req, res)=>{
  const userDocId = req.session.userDocId;
  const userName = req.session.userName;
  const timezoneOffset = req.session.timezoneOffset;
  const usrDay = new Date().toISOString(); //using today's day for now

  if(!req.session.userDocId){
    res.redirect('/');
  }else{
    findFoodItems(userDocId)
    .then((foodItemData)=>orderObjects(foodItemData))
    .then((orderedObjects)=>findDiaryItems(userDocId, usrDay, timezoneOffset, orderedObjects))
    .then((bothResults)=>{
      const foodDiary = bothResults[0];
      const foodItemList = bothResults[1];
      let nutritionTotals = calculateNutritionTotals(foodDiary);
      res.render('dashboard', {foodItemList: foodItemList, foodDiary:foodDiary, userName:userName, nutritionTotals: nutritionTotals});
    }).catch((error)=>{console.warn("Error getting to Dashboard: " + error.message)})
  }
});

app.get('/newitem', (req, res)=>{
  if(!req.session.userDocId){
    res.redirect('/');
  }else{
    res.render('newitem')
  }
});

// Post Requests ==========================================================
app.post('/signIn', (req, res)=>{
  req.session.data = null //remove old session data
  const email = req.body.email
  const password = req.body.password

  authenticateUser(email, password).then((result)=>{
    if(result[0] === false){
      //username or password didn't match
      res.redirect('/oops')
    }else if(result[0] === true){
      //successful sign-in
      req.session.userName = result[1];
      req.session.userDocId = result[2];
      res.redirect('/dashboard')
    }else{
      console.warn('Error During Sign In')
    }
  })

})

app.post('/', (req, res)=>{
  const timezoneOffset = req.body.timezoneOffset;
  req.session.timezoneOffset = timezoneOffset;
  res.send();
});

app.post('/newItem', (req, res)=>{
  if(!req.session.userDocId){
    res.redirect('/');
  }else{
    for (const key in req.body) {//set zero default
      if(req.body[key] == ''){
        req.body[key]=0
      }
    }
    addNewItem(req.body, req.session.userDocId)
    .then(function(){
        res.redirect('/dashboard');  
      });
  }
});

app.post('/addToDiary',(req, res)=>{
  if(!req.session.userDocId){
    res.redirect('/');
  }else{
    let bodyData = (req.body.foodItem)
    let jsonData = JSON.parse(bodyData);
    addToDiary(req.session.userDocId, jsonData).then(()=>{
      res.redirect('/dashboard')
    })
  }
})

app.post('/dashboard/modifyDiary', (req, res)=>{
  if(!req.session.userDocId){
    res.redirect('/');
  }else{
    let toDuplicate = (req.body.duplicateItem);
    let toRemove = (req.body.removeItem);
    if(toDuplicate){
      duplicateDiaryItem(toDuplicate).then(()=>{
        res.redirect('/dashboard');
      })
    }else if(toRemove){
      removeFromDiary(toRemove).then(()=>{
        res.redirect('/dashboard');
      }).catch(()=>{console.warn("error deleting item at POST")})
    }
    res.redirect('/dashboard');
  }
})

app.post('/newUser', (req, res)=>{
  const name = checkForNewName(req.body.newName);
  const newEmail = req.body.newEmail
  const newPassword = req.body.newPassword
  console.warn(name);
  //const confirmPassword = (req.body.confirmPassword);
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);
  addNewUser(name, newEmail, hashedPassword);
  res.redirect('/accountCreated')
});

app.post('/quickAdd', (req, res)=>{
  if(!req.session.userDocId){
    res.redirect('/');
  }else{
    let bodyData = (req.body)
    bodyData.name = '✓'
    addToDiary(req.session.userDocId, bodyData).then(()=>{
      res.redirect('/dashboard')
    })
  }
});

app.post('/passwordRecovery', (req, res)=>{
  let emailAddress = req.body.email;
  emailAddress = emailAddress.toLowerCase();

  checkForExistingUser(emailAddress).then((result)=>{
    if(result === true){
      console.log('true')
      sendPassResetEmail(emailAddress);
      res.status(200).send({message: true})
    }else{
      res.status(200).send({message: false});
    }
  })
})

// Server ==========================================================
let port = process.env.PORT;
if (port == null || port == "") {
  app.listen('3000', ()=>{
    console.warn('Listening on Port 3000') 
  });
}else{
  app.listen(port);
  console.warn('Listening on Port 5000') 
}