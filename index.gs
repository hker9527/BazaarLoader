function loadFlip() {
    Logger.clear();
    const RECIPES = recipes();

    const [_json, json] = get("bazaar", "https://api.hypixel.net/skyblock/bazaar", {
        json: true, 
        // validate: (d) => {return d.success},
        format: (d) => {
            const json = {};
            for (const product of Object.keys(d.products)) { // Trim down unused parts
                json[product] = d.products[product].quick_status;
            }
            return json;
        }
    });
    
    var output = [];

    function getPrice(item, old) {
        let j = old ? _json : json;
        const obj = {b: 0, s: 0};
        if (!j[item]) {
          Logger.log(item);
        } else {
          obj.b = j[item].buyPrice;
          obj.s = j[item].sellPrice;
        }
        return obj;
    }

    function beautifyName(name) {
        return name.replace(/_/g, " ").replace(/([A-Z])([A-Z]*)/g, (m, p1, p2) => p1 + p2.toLowerCase())
    }

    function genPriceArray(item) {
        let temp = getPrice(item, false);
        let _temp = getPrice(item, true);
        return [beautifyName(item), temp.b, temp.b - _temp.b, temp.s, temp.s - _temp.s];
    }

    let col = 0;
    let length = Object.keys(RECIPES).length;
    
    let comments = [];
    
    let rbp = [];
    let positive = 0;
    
    for (let outputName of Object.keys(RECIPES)) {
        for (let recipe of RECIPES[outputName]) {
            let row = ["", 0, 0, 0, 0];
            for (let ingredient of Object.keys(recipe.i)) {
                let _costArray = genPriceArray(ingredient); _costArray.shift();
                row = row.map((a, i) => i == 0 ? a : a + _costArray[i-1] * recipe.i[ingredient]);
            }
            let ingredientsList = Object.keys(recipe.i);
            let comment = ingredientsList.map(a => beautifyName(a) + " x " + recipe.i[a])
            if (ingredientsList.length > 1) {
                row[0] = comment[0] + " ..."
                comments.push([comment.join("\n")]);
            } else {
                row[0] = comment[0];
                comments.push([""]);
            }
            
            let outputPriceArray = genPriceArray(outputName);
            if (recipe.n != 1) {
              outputPriceArray[0] += " x " + recipe.n;
              for (let i = 1; i < outputPriceArray.length; i+=2) outputPriceArray[i] *= recipe.n;
            }
            row = [...row, ...outputPriceArray];
            col = Math.max(col, row.length);
            output.push(row);
            
            rbp.push(["=R[0]C[-2]-R[0]C[-9]"])
            if (row[8] - row[1] > 0) positive++;
        }
    }

    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Flips")
    let startRow = 3;
    let lastRow = length;
    sheet.getRange("B1").setValue(new Date().toISOString().replace(/T|Z/g, " "))

    sheet.getRange(startRow, 1, 200, col+1).clear({
        contentsOnly: true
    })

    sheet.getRange(startRow, 1, lastRow, col).setValues(output)
    sheet.getRange(startRow, 1, lastRow, 1).setNotes(comments)
    sheet.getRange(startRow, col+1, lastRow, 1).setFormulaR1C1("=R[0]C[-2]-R[0]C[-9]");
    
    SpreadsheetApp.flush();
    sheet.getRange(startRow, 1, lastRow, col+1).setBorder(false, false, false, false, false, false).sort({
        column: 11,
        ascending: false
    });
    
    SpreadsheetApp.flush();
    sheet.getRange(startRow + positive, 1, lastRow, col+1).setBorder(true, false, false, false, false, false).sort({
        column: 4,
        ascending: false
    });
    
    sheet.autoResizeColumns(1, col + 1)
    return true;
}