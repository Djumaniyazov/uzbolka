var fs = require("fs");
var sampleObject = {
    name: 'pankaj',
    member: 'stack',
    type: {
        x: 11,
        y: 22
    }
};

fs.writeFile("./object.json", JSON.stringify(sampleObject, null, 4), (err) => {
    if (err) {
        console.error(err);
        return;
    };
    console.log("File has been created");
});