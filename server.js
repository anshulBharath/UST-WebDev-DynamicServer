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
                if(err || (req.params.selected_year > 2018 || req.params.selected_year < 1960)) {
                    res.status(404).send("Error: Invalid Year");
                } else {

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
                }
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
            
            db.all('SELECT state_name, year, coal, natural_gas, nuclear, petroleum, renewable FROM Consumption NATURAL JOIN States WHERE state_abbreviation = ? ORDER BY year DESC', [req.params.selected_state], (err, rows) =>{

                //if(err) {
                    //res.status(404).send("Error: Invalid State Name");
                //} else {
                let list_items = '';
                
                let response = template.replace("{{{STATE_NAME}}}", rows[0].state_name);

                //Populating table
                var yearlyTotal;
                for(let i=0; i<rows.length; i++){
                    yearlyTotal = rows[i].coal + rows[i].natural_gas + rows[i].nuclear + rows[i].petroleum + rows[i].renewable;
                    list_items += '<tr>\n';
                    list_items += '<td>' + rows[i].year + '</td>\n';
                    list_items += '<td>' + rows[i].coal + '</td>\n';
                    list_items += '<td>' + rows[i].natural_gas + '</td>\n';
                    list_items += '<td>' + rows[i].nuclear + '</td>\n';
                    list_items += '<td>' + rows[i].petroleum + '</td>\n';
                    list_items += '<td>' + rows[i].renewable + '</td>\n';
                    list_items += '<td>' + yearlyTotal + '</td>\n';
                    list_items += '</tr>\n';
                }

                response = response.replace("{{{Table}}}", list_items);
                res.status(200).type('html').send(response);
                //}
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
            let response = template.replace('{{{Temp}}}', req.params.selected_energy_source);
            switch(req.params.selected_energy_source){
                case 'coal':
                    response = template.replace('{{{ENERGY_TYPE}}}', '\'Coal\'');
                    response = response.replace('{{{ENERGY}}}', 'Coal');
                    break;
                case 'natural_gas':
                    response = template.replace('{{{ENERGY_TYPE}}}', '\'Natural Gas\'');
                    response = response.replace('{{{ENERGY}}}', 'Natural Gas');
                    break;
                case 'nuclear':
                    response = template.replace('{{{ENERGY_TYPE}}}', '\'Nuclear\'');
                    response = response.replace('{{{ENERGY}}}', 'Nuclear');
                    break;
                case 'petroleum':
                    response = template.replace('{{{ENERGY_TYPE}}}', '\'Petroleum\'');
                    response = response.replace('{{{ENERGY}}}', 'Petroleum');
                    break;
                case 'renewable':
                    response = template.replace('{{{ENERGY_TYPE}}}', '\'Renewable\'');
                    response = response.replace('{{{ENERGY}}}', 'Renewable');
                    break;            
            }

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
                    //console.log(rows.length);
                    if(err) {
                        res.status(404).send("Error: Invalid Energy Source");
                    } else {
                        //Filling out energy counts dictionary for chart
                    let energy_dict = '{';
                    for(let i = 0; i < 51; i++) {
                        let energy_counts_state = '' + rows[i].state_abbreviation + ': [';
                        for(let j = i; j < rows.length; j += 51) {
                            switch(req.params.selected_energy_source){
                                case 'coal':
                                    if(j === rows.length - (51 - i)) {
                                        energy_counts_state = energy_counts_state + rows[j].coal;
                                        break;
                                    }
                                    energy_counts_state = energy_counts_state + rows[j].coal + ', ';
                                    break;
                                case 'natural_gas':
                                    if(j === rows.length - (51 - i)) {
                                        energy_counts_state = energy_counts_state + rows[j].natural_gas;
                                        break;
                                    }
                                    energy_counts_state = energy_counts_state + rows[j].natural_gas + ', ';
                                    break;
                                case 'nuclear':
                                    if(j === rows.length - (51 - i)) {
                                        energy_counts_state = energy_counts_state + rows[j].nuclear;
                                        break;
                                    }
                                    energy_counts_state = energy_counts_state + rows[j].nuclear + ', ';
                                    break;
                                case 'petroleum':
                                    if(j === rows.length - (51 - i)) {
                                        energy_counts_state = energy_counts_state + rows[j].petroleum;
                                        break;
                                    }
                                    energy_counts_state = energy_counts_state + rows[j].petroleum + ', ';
                                    break;
                                case 'renewable':
                                    if(j === rows.length - (51 - i)) {
                                        energy_counts_state = energy_counts_state + rows[j].renewable;
                                        break;
                                    }
                                    energy_counts_state = energy_counts_state + rows[j].renewable + ', ';
                                    break;            
                            }
                        }
                        energy_counts_state = energy_counts_state + ']';
                        if(i === 50) { 
                            energy_dict = energy_dict + energy_counts_state;
                            break; 
                        }

                        energy_dict = energy_dict + energy_counts_state + ', ';
                    }
                    energy_dict = energy_dict + '}';

                    response = response.replace('{{{ENERGY_COUNTS}}}', energy_dict);

                    //console.log(energy_dict);

                    let data_items = '';
                    let rowCount=0 //Running count of the row
                    let yearArray = '[';
                    //loops through the years to set the first column
                    for(let i = 1960; i <= 2018; i++) {
                        data_items += '<tr>\n';
                        data_items += '<td class="year-column">' + i + '</td>\n';
                        
                        if(i<2018){
                            yearArray = yearArray + i + ', ';
                        }

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

                    yearArray = yearArray + ' 2018];';

                    response = response.replace('{{{YEAR_ARRAY}}}', yearArray);
                    response = response.replace('{{{TABLE_DATA}}}', data_items);
                    res.status(200).type('html').send(response); 
                    }
                });
            });
        }
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
