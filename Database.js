const mongoclient = require("mongodb").MongoClient
const url = "mongodb+srv://jayaramskumar:just4marry@cluster0.gguofay.mongodb.net/matrimony?retryWrites=true&w=majority"
const state = {
    db:null
}

const dbname = 'matrimony'

mongoclient.connect(url,(err,data)=>{
    if(err) throw err
    state.db=data.db(dbname)
})

module.exports.get=()=>{
    return state.db
}







