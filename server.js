// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

let app = express();
let port = 8000;

// Open usenergy.sqlite3 database
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' (redirect to /year/2018)
app.get('/', (req, res) => {
    res.redirect('/year/2018');
});

// GET request handler for '/year/*'
app.get('/year/:selected_year',(req, res) => {
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'year.html'), 'utf-8', (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        if(err){
            res.status(404).send("Error: File Not Found");
        }
        else { 
            let response = template.replace("{{{YEAR}}}", req.params.selected_year);
            db.all('SELECT state_abbreviation, coal, natural_gas, nuclear, petroleum, renewable FROM Consumption WHERE year = ?;', [req.params.selected_year], (err, rows) =>{
                let list_items = '';

                //Populating table
                for(let i=0; i<rows.length; i++){
                    list_items += '<tr>\n';
                    list_items += '<td>' + rows[i].state_abbreviation + '</td>\n';
                    list_items += '<td>' + rows[i].coal + '</td>\n';
                    list_items += '<td>' + rows[i].natural_gas + '</td>\n';
                    list_items += '<td>' + rows[i].nuclear + '</td>\n';
                    list_items += '<td>' + rows[i].petroleum + '</td>\n';
                    list_items += '<td>' + rows[i].renewable + '</td>\n';
                    list_items += '</tr>\n';
                }

                let coalTotal = 0;
                for(let i=0; i<rows.length; i++){
                    coalTotal += rows[i].coal;
                }
                response = response.replace("{{{COAL_COUNT}}}", coalTotal);

                let naturalGasTotal = 0;
                for(let i=0; i<rows.length; i++){
                    naturalGasTotal += rows[i].natural_gas;
                }
                response = response.replace("{{{NATURAL_GAS_COUNT}}}", naturalGasTotal);

                let nuclearTotal = 0;
                for(let i=0; i<rows.length; i++){
                    nuclearTotal += rows[i].nuclear;
                }
                response = response.replace("{{{NUCLEAR_COUNT}}}", nuclearTotal);

                let petroleumTotal = 0;
                for(let i=0; i<rows.length; i++){
                    petroleumTotal += rows[i].petroleum;
                }
                response = response.replace("{{{PETROLEUM_COUNT}}}", petroleumTotal);

                let renewableTotal = 0;
                for(let i=0; i<rows.length; i++){
                    renewableTotal += rows[i].renewable;
                }
                response = response.replace("{{{RENEWABLE_COUNT}}}", renewableTotal);

                response = response.replace("{{{Table}}}", list_items);
                res.status(200).type('html').send(response);
            });
            
        }
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    console.log(req.params.selected_state);
    fs.readFile(path.join(template_dir, 'state.html'), 'utf-8',(err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        //res.status(200).type('html').send(template); // <-- you may need to change this
    
        if(err){
            res.status(404).send("Error: File Not Found");
        }
        else {
            let response = template.replace("{{{STATE_NAME}}}", req.params.selected_state);
            response = response.replace("{{{STATE}}}", "\"" + req.params.selected_state + "\"");
            db.all('SELECT year, coal, natural_gas, nuclear, petroleum, renewable FROM Consumption WHERE state_abbreviation = ? ORDER BY year DESC', [req.params.selected_state], (err, rows) =>{
                let list_items = '';

                //Populating table
                for(let i=0; i<rows.length; i++){
                    list_items += '<tr>\n';
                    list_items += '<td>' + rows[i].year + '</td>\n';
                    list_items += '<td>' + rows[i].coal + '</td>\n';
                    list_items += '<td>' + rows[i].natural_gas + '</td>\n';
                    list_items += '<td>' + rows[i].nuclear + '</td>\n';
                    list_items += '<td>' + rows[i].petroleum + '</td>\n';
                    list_items += '<td>' + rows[i].renewable + '</td>\n';
                    list_items += '</tr>\n';
                }
                /*
                let coalTotal = 0;
                coalTotal += rows.coal;
                response = response.replace("{{{COAL_COUNT}}}", coalTotal);

                let naturalGasTotal = 0;
                naturalGasTotal += rows.natural_gas;
                response = response.replace("{{{NATURAL_GAS_COUNT}}}", naturalGasTotal);

                let nuclearTotal = 0;
                nuclearTotal += rows.nuclear;
                response = response.replace("{{{NUCLEAR_COUNT}}}", nuclearTotal);

                let petroleumTotal = 0;
                petroleumTotal += rows.petroleum;
                response = response.replace("{{{PETROLEUM_COUNT}}}", petroleumTotal);

                let renewableTotal = 0;
                renewableTotal += rows.renewable;
                response = response.replace("{{{RENEWABLE_COUNT}}}", renewableTotal);

                response = response.replace("{{{Table}}}", list_items);
                res.status(200).type('html').send(response);
                */

                let coalTotal = 0;
                for(let i=0; i<rows.length; i++){
                    coalTotal += rows[i].coal;
                }
                response = response.replace("{{{COAL_COUNTS}}}", coalTotal);

                let naturalGasTotal = 0;
                for(let i=0; i<rows.length; i++){
                    naturalGasTotal += rows[i].natural_gas;
                }
                response = response.replace("{{{NATURAL_GAS_COUNTS}}}", naturalGasTotal);

                let nuclearTotal = 0;
                for(let i=0; i<rows.length; i++){
                    nuclearTotal += rows[i].nuclear;
                }
                response = response.replace("{{{NUCLEAR_COUNTS}}}", nuclearTotal);

                let petroleumTotal = 0;
                for(let i=0; i<rows.length; i++){
                    petroleumTotal += rows[i].petroleum;
                }
                response = response.replace("{{{PETROLEUM_COUNTS}}}", petroleumTotal);

                let renewableTotal = 0;
                for(let i=0; i<rows.length; i++){
                    renewableTotal += rows[i].renewable;
                }
                response = response.replace("{{{RENEWABLE_COUNTS}}}", renewableTotal);

                response = response.replace("{{{Table}}}", list_items);
                res.status(200).type('html').send(response);
            });
        }
    });
});

// GET request handler for '/energy/*'
app.get('/energy/:selected_energy_source', (req, res) => {
    console.log(req.params.selected_energy_source);
    fs.readFile(path.join(template_dir, 'energy.html'), 'utf-8', (err, template) => {
        if(err) {
            res.status(404).send("Error: File Not Found");
        } else {
            let response = template.replace('{{{ENERGY_TYPE}}}', req.params.selected_energy_source);
            response = response.replace('{{{ENERGY}}}', req.params.selected_energy_source);

            db.all('SELECT state_abbreviation FROM States',(err, states) => {
                //Using state table to fill in state abreviation because of ordering of states when queried
                let list_items = '';
                    for(let i = 0; i < states.length; i++) {
                        list_items += '<th>' + states[i].state_abbreviation + '</th>';
                    }
                    response = response.replace('{{{STATE_ABB}}}', list_items);

                //Had to SELECT * here because the ? mark syntax was not working here for some reason
                let querry = 'SELECT year, state_abbreviation, ' +req.params.selected_energy_source+ ' FROM Consumption ORDER BY year, state_abbreviation';
                db.all(querry,(err, rows) => {
                    //res.send(rows);

                    let data_items = '';
                    let rowCount=0 //Running count of the row

                    //loops through the years to set the first column
                    for(let i = 1960; i <= 2018; i++) {
                        data_items += '<tr>\n';
                        data_items += '<td>' + i + '</td>\n';
                    
                        for(let i=0; i<51; i++){
                            switch(req.params.selected_energy_source){
                                case 'coal':
                                    data_items += '<td>' + rows[rowCount].coal+ '</td>\n';
                                    break;
                                case 'natural_gas':
                                    data_items += '<td>' + rows[rowCount].natural_gas+ '</td>\n';
                                    break;
                                case 'nuclear':
                                    data_items += '<td>' + rows[rowCount].nuclear+ '</td>\n';
                                    break;
                                case 'petroleum':
                                    data_items += '<td>' + rows[rowCount].petroleum+ '</td>\n';
                                    break;
                                case 'renewable':
                                    data_items += '<td>' + rows[rowCount].renewable+ '</td>\n';
                                    break;            
                            }
                        rowCount++;
                        }
                        data_items += '</tr>\n'; //End of row
                    }
                    response = response.replace('{{{TABLE_DATA}}}', data_items);
                    res.status(200).type('html').send(response); 
                });
            });
        }
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
