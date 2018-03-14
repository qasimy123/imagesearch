const express = require("express");
const app = express();
const mongo = require("mongodb").MongoClient;
const fetch = require("node-fetch");
let query = ""
let start = 1;

//"&q=dog&&cx=007893821661851908597:2bwxfig8riy&alt=json"
const BASE_URL = `https://www.googleapis.com/customsearch/v1?key=AIzaSyDeFzjUpUnqcTLPQ0pYFyxZw5Z-98iDCUk&cx=007893821661851908597:2bwxfig8riy&num=10&searchType=image&q=`;

app.use(express.static('public'));


app.get("/", (req, res)=>{
  res.sendFile(__dirname + '/views/index.html');
})

app.get("/api/imagesearch/:query", (req, res)=>{

  query = req.params.query;
  start = req.query.page;
  
  
  database(true, {query});
  res.writeHead(200, {"Content-Type":"application/json"});
  imagesearch(query, start)
  .then(
  data=>{
    
    const formattedData = data.items.map((result)=>{
    
      return {
      
        url:result.link,
        snippet:result.snippet,
        thumbnail:result.image.thumbnailLink,
        context:result.image.contextLink
      
      
      }
    
    })
  res.end(JSON.stringify(formattedData));
  
  
  }
  
    
  )
  
  

})

app.get("/api/latest", (req, res)=>{

  
  res.writeHead(200, {"Content-Type":"application/json"});
  
  database(false).then(recent=>{
  
  
    
  res.end(JSON.stringify(recent.map(val=>{
  const {when, term} = val;
    
    return {term, when}
  
  })))
  
  })
  

 

})

function imagesearch(query, start){

  
  let url = BASE_URL+query;
  
  if(start){
    url = url + "&start="+ start;
  
  }
  
  return fetch(url)
    .then(res=>res.json())
    .then(json=>
    json
  );
  
  

}


function database(isWrite, dataToInsert){

  
return new Promise((resolve, reject)=>{


mongo.connect(process.env.URL, (err, client)=>{
    const collection = client.db().collection("recent");
  
    if(err){
    reject(err);
    }
  
  if(isWrite){
    const {query} = dataToInsert; 
    collection.insert({term:query, when:new Date()});
    resolve();
    client.close();
  }
  else {
  
    collection.find({}).sort({_id:-1}).limit(10).toArray((err, docs)=>{
    
      if(err){
      reject(err)
      }
      
      resolve(docs);
    
    client.close();
    });
  }
  
  });

})
  
  
  
}

app.listen(process.env.PORT)