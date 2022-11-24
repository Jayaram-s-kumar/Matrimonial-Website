var express = require('express');
const { ObjectId } = require('mongodb');
const { PromiseProvider } = require('mongoose');
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
  let allusers =await db.get().collection("userinfo").find(
    {loginid:{
      $nin:[req.session.loginid]
    }}
  ).toArray()

  let currdata = await db.get().collection('userinfo').findOne(
    {
      loginid:req.session.loginid
    } 
  )     

  let curr_user_id=''
  if(currdata){
    curr_user_id = currdata._id 
  }

  res.render('layouts/home',{loggedin:req.session.loggedin,username:req.session.username,allusers:allusers,loginid:req.session.loginid,curr_user_id:curr_user_id})
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
  if(req.body.name=='' || req.body.age=='' || req.body.fathersname=='' ||
  req.body.mothersname=='' || req.body.Education=='' || req.body.familytype==''
  || req.body.familystatus=='' || req.body.livingin=='' || 
  req.body.height=='' || req.body.bodytype=='' || req.body.complexion==''||
  req.body.about==''){
    res.render('layouts/create_user',{loginid:req.session.loginid,loggedin:req.session.loggedin,username:req.session.username,Error:'Please fill all the fields',partial_data:req.body})
  }else{
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
    db.get().collection('userinfo').updateOne(
      {loginid:req.body.loginid},
      {
        $set:{
          intrested:[],
          myintrests:[]
        }
      }
    )
    res.redirect('/myaccount') 
    console.log(req.session)
  }
 
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


router.get('/requests',verifylogin, async(req,res)=>{
  let current_user =await db.get().collection('userinfo').findOne({loginid:req.session.loginid})
  if(current_user){
    let requests_id_array = current_user.intrested
    let array=[]
    for(i=0;i<requests_id_array.length;i++){
      array[i]=requests_id_array[i].userid
    }
  
  
    let requested_users =await db.get().collection('userinfo').find(
      {
        _id:{
          $in:array
        }
      }
    ).toArray()  
  
    let myintrestsid_id_array = current_user.myintrests
    let array1=[]
    for(i=0;i<myintrestsid_id_array.length;i++){
      array1[i]=myintrestsid_id_array[i].userid
    }
  
    let intrested_users = await db.get().collection('userinfo').find(
      {
        _id:{
          $in:array1
        }
      }
    ).toArray()
  
    
    let currdata = await db.get().collection('userinfo').findOne(
      {
        loginid:req.session.loginid
      } 
    )
  
    let curr_user_id=''
    if(currdata){
      curr_user_id = currdata._id
    }
  
    res.render('layouts/requests',{loggedin:req.session.loggedin,username:req.session.username,loginid:req.session.loginid,requested_users:requested_users,intrested_users:intrested_users,curr_user_id:curr_user_id,requests_id_array:requests_id_array})
  
  }else{
    res.redirect('/myaccount')
  }
  
  
}) 



router.post('/sendintrest',async(req,res)=>{  
  
  db.get().collection('userinfo').updateOne(  
    {loginid:req.body.loginid},
    {
      $push:{
        myintrests:{
          userid:ObjectId(req.body.request_to),
          accepted:false  
        }
      }
    }
  ) 
 
  console.log("myintrest:",req.body.request_to)

  let data = await  db.get().collection('userinfo').findOne( 
    {loginid:req.body.loginid} 
  )

  //use findone and don't use toArray()

  const userid = data._id
  db.get().collection('userinfo').updateOne(
    {_id:ObjectId(req.body.request_to)}, 
    {
      $push:{
        intrested:{
          userid:userid,
          accepted:false
        }
      } 
    }
  )
 
  console.log("intrested:",userid.toString())  
  
})

   
router.post('/acceptrequest',async(req,res)=>{
 // console.log(req.body)
  let data = await db.get().collection('userinfo').updateOne(
    {loginid:req.session.loginid,"intrested.userid":ObjectId(req.body.requested_id)},
   
    {
      $set:{
        "intrested.$.accepted":true
      }
    }
  )


  let currdata = await db.get().collection('userinfo').findOne(
    {
      loginid:req.session.loginid
    } 
  )

  let curr_user_id=''
  if(currdata){
    curr_user_id = currdata._id
  }

  //console.log("current user",curr_user_id)
  //console.log("myintrests id",req.body.requested_id)
  
  await db.get().collection('userinfo').updateOne(
    {_id:ObjectId(req.body.requested_id),"myintrests.userid":curr_user_id},

    {
      $set:{
        "myintrests.$.accepted":true
      }
    }
  )
  res.redirect('/requests') 
}) 


router.get('/viewprofile/:id',async(req,res)=>{
  console.log(req.params.id)
  let data =await db.get().collection('userinfo').findOne(
    {
      _id:ObjectId(req.params.id)
    }
  )
  res.render('layouts/viewprofile',{data:data})
})  

router.post('/search',async(req,res)=>{
  let data = await db.get().collection('userinfo').findOne(
    {
      name:req.body.search_name
    }
  )
  
  let currdata = await db.get().collection('userinfo').findOne(
    {
      loginid:req.session.loginid
    }
  )


  let curr_user_id=''
  if(currdata){
    curr_user_id = currdata._id 
  }

  //console.log(curr_user_id)
  //console.log(data)

  res.render('layouts/home',{
    loggedin:req.session.loggedin,
    username:req.session.username,
    loginid:req.session.loginid,
    curr_user_id:curr_user_id,
    searched_data:data,
    intrested:data.intrested,
  })
 
  //res.redirect('/')

})


  




module.exports = router;



     