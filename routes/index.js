var express = require('express');
const { ObjectId } = require('mongodb');
var router = express.Router();
const db = require('../Database')

const verifylogin = (req,res,next)=>{
  if(req.session.loggedin){
    next()
  }else{
    res.render('layouts/signin')
  }
}

/* GET home page. */
router.get('/', async function(req,res){
  let allusers =await db.get().collection("userinfo").find().toArray()
  res.render('layouts/home',{loggedin:req.session.loggedin,username:req.session.username,allusers:allusers})
});

router.get('/signin',verifylogin,(req,res)=>{
  res.render('layouts/signin')
})


router.get('/signup',(req,res)=>{
  //Dont put /layouts here
  if(req.session.loggedin){
    res.redirect('/')
  }else{
    res.render("layouts/signup")
  }
})
  
router.post('/signup',(req,res)=>{
  db.get().collection('logininfo').insertOne(req.body)
  res.redirect('/signin')
  
})   

router.post('/signin',async(req,res)=>{
  var pass = req.body.password
  let user = await db.get().collection('logininfo').findOne({name:req.body.name})  
  if(user){
    if(user.password==pass){
      console.log("user loged in")
      req.session.username=user.name
      req.session.loggedin=true
      req.session.loginid=user._id
      res.redirect('/')
    }else{
      console.log("incorrect password")
      res.render('layouts/signin',{passErr:"incorrect password"})
    }
  }else{
    console.log("incorrect username")
    res.render('layouts/signin',{nameErr:"incorrect username"})
  }

})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/myaccount',async(req,res)=>{
  
    console.log(req.session)
   
    if(req.session.loggedin){
      let data =await db.get().collection('userinfo').findOne({loginid:req.session.loginid})
     
      if(data){
        res.render("layouts/profile",{loggedin:req.session.loggedin,username:req.session.username,userdata:data,imagename:data._id.toString()})
   
      }else{
      res.render('layouts/create_user',{loginid:req.session.loginid,loggedin:req.session.loggedin,username:req.session.username})
      }
    }else{
      res.redirect('/signin')
    }
})  


router.post('/createuser',(req,res)=>{
  console.log("createing user")
  db.get().collection('userinfo').insertOne(req.body).then((data)=>{
    let imagename = data.insertedId
    if(req.files){
      let image = req.files.Image
      image.mv("./public/userimages/"+imagename+".jpg",(err,done)=>{
      if(!err){
        console.log("image inserted")
      }else{
        throw err
      }
    }) 
    }
  })
  res.redirect('/myaccount')
})

router.get("/edit/:id",async (req,res)=>{
    let data =await db.get().collection('userinfo').findOne({_id:ObjectId(req.params.id)})
    res.render('layouts/edit_user',
    {currdata:data,
      imagename:data._id.toString(),
      loggedin:req.session.loggedin,
      username:req.session.username,
      loginid:req.session.loginid})
  
})

router.post('/edit/:id',async (req,res)=>{
  await db.get().collection("userinfo").updateOne({_id:ObjectId(req.params.id)},{
    $set:{
      name:req.body.name,
      age:req.body.age,
      fathersname:req.body.fathersname,
      mothersname:req.body.mothersname,
      Education:req.body.Education,
      familytype:req.body.familytype,
      familystatus:req.body.familystatus,
      livingin:req.body.livingin,
      height:req.body.height,
      bodytype:req.body.bodytype,
      complexion:req.body.complexion,
      about:req.body.about,
      loginid:req.body.loginid
    }
  }).then((data)=>{
    let imagename = req.params.id
    if(req.files){
      let image = req.files.Image
      image.mv("./public/userimages/"+imagename+".jpg",(err,done)=>{
      if(!err){
        console.log("image updated")
      }else{
        throw err
      }
    }) 
    }
  })
  res.redirect('/myaccount')
 
})

router.get('/filter',verifylogin,(req,res)=>{
  res.render("layouts/filter",{loggedin:req.session.loggedin,username:req.session.username})
})

router.post('/filter',async (req,res)=>{

  const edu_data=req.body.Education=="choose" ? ["btech","mtech","diploma","predegree"]  : [req.body.Education]
  const familytype_data=req.body.familytype=="please select" ? ["joint-family","nuclear-family"]  :  [req.body.familytype]
  const familystatus_data=req.body.familystatus=="please select" ?  ["lower-income","middle-class","upper-middle","rich"] : [req.body.familystatus]
  const bodytype_data = req.body.bodytype=="please select"  ?  ["Athletic","Average","Heavy","Slim"] : [req.body.bodytype]
  const complexion_data = req.body.complexion=="please select" ?  ["very-fair","fair","Wheatish"] : [req.body.complexion] 
  const lower = req.body.lowerage ? req.body.lowerage : 0
  const higer = req.body.higherage ? req.body.higherage : 200

  let age=[]
  for(i=lower;i<higer;i++){
    age[i]=i.toString()
  }
  //console.log(age)


 
  const filereddata = await db.get().collection("userinfo").find({
    age:{$in:age},
    Education:{$in:edu_data},
    familytype:{$in:familytype_data},
    familystatus:{$in:familystatus_data},
    bodytype:{$in:bodytype_data},
    complexion:{$in:complexion_data}
   }).toArray()

  console.log("lower",lower,"higer",higer)
  console.log(edu_data)
  console.log(familystatus_data)
  console.log(familytype_data)
  console.log(bodytype_data)
  console.log(complexion_data)
  //console.log(filereddata)

  res.render('layouts/home',{loggedin:req.session.loggedin,username:req.session.username,filter:true,data:filereddata})
  
})

module.exports = router;
