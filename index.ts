const express = require("express");
const bodyParser = require("body-parser");
const markdown = require("markdown-it");
const {MongoClient} = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017/");

const md = markdown();
const app = express();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

type Post = {
    title: string;
    text: string;
    html: string;
    date: string;
};
let db:any;
let col:any;
async function connectDb(){
    await client.connect();
    db = client.db("blogs");
    col = db.collection("posts");
}
app.get("/", (req: any, res: any) =>{
    res.send(`
             <form action="/submit" method="POST">
             <input name="title" type="text" placeholder="Title"><br>
             <textarea name="markdown" rows="10" cols="50"></textarea>
             </br>
             <input type="submit" value="Submit">
             </form>
             `);
});

//handle form submission
app.post("/submit", async(req: any, res: any) =>{
try{
    const text = req.body.markdown;
    const title = req.body.title;
    const html = md.render(text);
   
    const post:Post = {
        title: title,
        html: html,
        text: text,
        date: new Date().toISOString(),
    };

    await saveData(post);
    console.log("Data saved");
    res.status(200).send(`<h1>${title}</h1> ${html}`);
}catch(err:any){
    res.status(500).send("An error occured while saving Posts!")
}
});

app.get("/posts", async(req: any, res: any) =>{
try{
    const posts = await getPosts(); 
    res.status(200).send(posts.map((post: any) => (`<h1>${post.title}</h1> ${post.html}`)).join("<br>"));
}catch(err: any){
    res.status(500).send("An error Ocurred when fetching Data!")
}
});

async function saveData(data: Post): Promise<boolean>{
try{
    await client.connect();
    console.log("Client connected succefully");
    await col.insertOne({
        title: data.title,
        html: data.html,
        markdown: data.text,
        date: Date(),
    });
    return true;
}catch(err: any){
    console.log(err.message);
    return false;
};

};

async function getPosts(): Promise<Post[]>{
    return await col.find({}).toArray();
}
const PORT = 3000;
app.listen(PORT, async()=>{
    await connectDb();
    console.log(`Server listening at port ${PORT}`);
});
