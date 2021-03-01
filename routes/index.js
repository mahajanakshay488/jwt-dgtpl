var express = require('express');
var router = express.Router();
const userModel = require('./users');

const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var storage = multer.diskStorage({
  destination: (req, file, cb)=>{
    cb(null, './public/images');
  },

  filename: (req, file, cb)=>{
    cb(null, Date.now()+ '-' + file.fieldname);
  }
});

var upload = multer({storage: storage});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.get('/userslist', (req, res)=>{
  res.render('usersp');
});

router.get('/loginp', (req, res)=>{
  res.render('loginp');
});

router.get('/profile', (req, res)=>{
  g
  res.render('profile');
});

router.post('/reg', (req, res)=>{
  const { email, password } = req.body;

  const newUser = new userModel({ email, password});
  
  userModel.findOne({email})
  .then(user => {
    if(user) res.send('email is already taken!');

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
          if(err) throw err;
          newUser.password = hash;
          newUser.save()
          .then(sUser=>{
            res.redirect('profile');
            console.log(sUser);
          })
          .catch(err=>{
            res.send(err);
            console.log(err);
          });
      });
  });
});

});

router.post('/login', (req, res)=>{

const { email, password } = req.body;

userModel.findOne({email})
.then(fuser =>{
  if(!fuser) res.send('user not found!');

  bcrypt.compare(password, fuser.password)
  .then(isMatch =>{
    if(!isMatch) res.send('incorrect password!');

    const token = jwt.sign({fuser}, 'djiefdj3df;dkd', { expiresIn: 3600 });
    req.header('auth-token', token);
    res.redirect('/profile');
  });
});


});

router.get('/logout', (req, res)=>{

});


module.exports = router;
