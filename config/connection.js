const MongoClient = require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect = function(done){
    const url='mongodb+srv://vaishak:2X8bUhQ5JCETZPia@cluster0.rddhz.mongodb.net/shopping?retryWrites=true&w=majority'
    const dbname = 'shopping'

    MongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
    
}

module.exports.get=function(){
    return state.db
} 