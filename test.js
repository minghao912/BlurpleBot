const json = require('json-update');
const fs = require('fs');


//Change approved status
json.update(`data.json`, {Approved: "rejected"}).then( (e) => {console.log(`> data.json amended`);});

async function f() {
//Beautify it (messy but works)
await json.load(`data.json`, async function(err, obj) {
    if (err) {console.log(err)}
    console.log(obj);

    const beautify = JSON.stringify(obj, null, 4);
    console.log(beautify);

    fs.writeFile('data.json', beautify, 'utf8');

    console.log('beautified');
})
}

setTimeout(f, 1000);

