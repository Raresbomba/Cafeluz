const express= require("express");
const path= require("path");
const fs = require("fs");
const urlindex = ["/", "/home", "/index"];
const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
const sass = require('sass');
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);

    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Folderul "${folder}" a fost creat.`);
    } else {
        console.log(`Folderul "${folder}" există deja.`);
    }
}


//Definire SCSS

global.folderScss = path.join(__dirname, 'resurse', 'scss');
global.folderCss = path.join(__dirname, 'resurse', 'css');
global.folderBackup = path.join(__dirname, 'backup');
const foldereScss = [
    global.folderScss,
    global.folderCss
];

foldereScss.forEach(folder => {
    if(!fs.existsSync(folder)){
        fs.mkdir(folder, {recursive: true});
    }
});

//Functie de compilare SCSS

function compileazaScss(caleScss, caleCss){
    let drumScss, drumCss;
    if(path.isAbsolute(caleScss)){
        drumScss = caleScss;
    }
    else{
        drumScss = path.join(global.folderScss, caleScss);
    }

    if(!caleCss){
        const numeFisierScss = path.basename(drumScss, '.scss');
        drumCss = path.join(global.folderCss, numeFisierScss + '.css');
    }
    else if(path.isAbsolute(caleCss)){
        drumCss = caleCss;
    }
    else{
        drumCss = path.join(global.folderCss, caleCss);
    }

    //Salvarea in backup a fisierului Css

    if(fs.existsSync(drumCss)){
        try{
            const numeFisierCss = path.basename(drumCss);
            const fisierDestBackup = path.join(global.folderBackup, "resurse", "css");
            const caleBackup = path.join(fisierDestBackup, numeFisierCss);
            if(!fs.existsSync(fisierDestBackup)){
                fs.mkdirSync(fisierDestBackup, {recursive : true});
            }
            fs.copyFileSync(drumCss, caleBackup);
        }
        catch (err) {
            console.error(`[Eroare Backup] Nu s-a putut crea copia de rezervă: ${err.message}`);
        }
    }

    try{
        if(!fs.existsSync(drumScss)){
            console.error(`Eroare: Fisierul Scss nu a fost gasit la calea: ${drumScss}`);
            return;
        }
        const rezultat = sass.compile(drumCss, rezultat.css);
    }
    catch(eroare){
        console.error(eroare.message);
    }
}

///Compilarea initiala SCSS

function compilareInitialaScss() {
    try {
        const fisiere = fs.readdirSync(global.folderScss);
        const fisiereScss = fisiere.filter(f => path.extname(f).toLowerCase() === '.scss');
        if (fisiereScss.length === 0) {
            console.log("Nu s-au găsit fișiere SCSS pentru compilare.");
            return;
        }

        fisiereScss.forEach(fisier => {
            compileazaScss(fisier);
        });
    } catch (eroare) {
        console.error("Eroare la citirea folderului SCSS:", eroare.message);
    }
}

//Compilarea pe parcurs Scss

function compilareParcursScss() {
    fs.watch(global.folderScss, (eventType, filename) => {
        if (filename && filename.endsWith('.scss')) {
            if (filename.startsWith('_')) return;
            compileazaScss(filename);
        }
    });
}




app= express();
app.set("view engine", "ejs")

obGlobal={
    obErori:null,
    obImagini:null,
}

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

app.get("/cale", function(req,res){
    let userip = req.ip;
    console.log("Am primit o cerere GET la adresa /cale");
    res.send("Raspuns la GET");
});

app.get('/galerie', (req, res) => {
    const pozeJson = fs.readFileSync(path.join(__dirname,'/resurse/json/galerie.json'), 'utf8');
    const pozeGalerie = JSON.parse(pozeJson);
    res.render('pagini/galerie-statica', { galerie: pozeGalerie });
});

app.get("/cale2",function(req,res){
    let userip = req.ip;
    res.write("ceva");
    res.end();
});

app.get(urlindex, function(req,res){
    let userip = req.ip;
    const pozeJson = fs.readFileSync(path.join(__dirname,'/resurse/json/galerie.json'), 'utf8');
    const pozeGalerie = JSON.parse(pozeJson);
    res.render("pagini/index", {ip: userip, galerie: pozeGalerie});
});

app.get("despre/prezentare", function(req,res){
    let userip = req.ip;
    res.render("pagini/prezentare", {ip: userip});
})


app.get("/cale/:a/:b",function(req,res){
    res.send(parseInt(req.params.a) + parseInt(req.params.b));
});

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse/json/erori.json")).toString("utf-8");
    let erori=obGlobal.obErori=JSON.parse(continut)
    let err_default=erori.eroare_default
    err_default.imagine=path.join(erori.cale_baza, err_default.imagine)
    for (let eroare of erori.info_erori){
        eroare.imagine=path.join(erori.cale_baza, eroare.imagine)
    }
}
initErori()

function afisareEroare(res, identificator, titlu, text, imagine){
    //TO DO cautam eroarea dupa identificator
    let eroare = obGlobal.obErori.info_erori.find((elem) =>
        elem.identificator === identificator
    )
    if(eroare?.status)
        res.status(eroare.identificator);
    //daca sunt setate titlu, text, imagine, le folosim, 
    //altfel folosim cele din fisierul json pentru eroarea gasita
    //daca nu o gasim, afisam eroarea default
    let errDefault = obGlobal.obErori.eroare_default
     res.render("pagini/eroare", {
        ip: res.req.ip,
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
    });
}

app.get("/favicon.ico", function(req,res){
    res.sendFile(path.join(__dirname, "/resurse/imagini/favicon/favicon.ico"))
})

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.get("/*pagina", function(req,res){
    console.log("Cale pagina", req.url)
    if(req.url.startsWith("/resurse") && path.extname(req.path)==""){
        afisareEroare(res,403);
        return;
    }
    if(path.extname(req.url)==".ejs"){
        afisareEroare(res,400);
        return;
    }

    let userip = req.ip;

    try{
        res.render("pagini"+req.url, {ip : userip} , function(err, rezRandare){
            if(err){
                if(err.message.includes("Failed to lookup view")){
                    afisareEroare(res,404);
                    return;
                }
                afisareEroare(res);
                return;
            }
            res.send(rezRandare);
            console.log("Randare: ", res.rezRandare);
        });
    }
    catch(err){
        if(err.message.includes("Cannot find module")){
            afisareEroare(res,404);
            return;
        }
        afisareEroare(res);
        return;
    }
});

//Apelarea functiilor Scss

compilareInitialaScss();
compilareParcursScss();



app.listen(8081);
console.log("Serverul a pornit!");

