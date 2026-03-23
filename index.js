const express= require("express");
const path= require("path");

app= express();
app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

app.get("/cale", function(req,res){
    console.log("Am primit o cerere GET la adresa /cale");
    res.send("Raspuns la GET");
});

app.get("/cale2",function(req,res){
    res.write("ceva");
    res.end();
});

app.get("/",function(req,res){
    res.render("pagini/index");
});


app.get("/cale/:a/:b",function(req,res){
    res.send(parseInt(req.params.a) + parseInt(req.params.b));
});

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.listen(8081);
console.log("Serverul a pornit!");

