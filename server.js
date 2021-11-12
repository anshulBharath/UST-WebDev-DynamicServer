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
    res.redirect('/home');
});

app.get('/home',(req, res) => {
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'home.html'), 'utf-8', (err, page) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        if(err){
            res.status(404).send("Error: File Not Found");
        }
        else { 
            res.status(200).type('html').send(page);
        }
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year',(req, res) => {
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'year.html'), 'utf-8', (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        if(err || (req.params.selected_year > 2018 || req.params.selected_year < 1960) || isNaN(req.params.selected_year) === true) {
            res.status(404).send("Error: Invalid Year");
        }
        else { 
            let response = template.replace("{{{YEAR}}}", req.params.selected_year);

            let nextYear = parseInt(req.params.selected_year) + 1;
            let prevYear = parseInt(req.params.selected_year) - 1;

            if(nextYear > 2018){
                response = response.replace("{{{NEXT_VISIBLE}}}", "hidden");
            }
            else{
                response = response.replace("{{{NEXT_VISIBLE}}}", "visible");
                response = response.replace("{{{NEXT_YEAR}}}", nextYear);
            }

            if(prevYear < 1960){
                response = response.replace("{{{PREV_VISIBLE}}}", "hidden");
            }
            else{
                response = response.replace("{{{PREV_VISIBLE}}}", "visible");
                response = response.replace("{{{PREV_YEAR}}}", prevYear);
            }

            db.all('SELECT state_abbreviation, coal, natural_gas, nuclear, petroleum, renewable FROM Consumption WHERE year = ?;', [req.params.selected_year], (err, rows) =>{
                

                let list_items = '';

                //Populating table
                for(let i=0; i<rows.length; i++){
                    list_items += '<tr>\n';
                    list_items += '<td style=\"font-weight: bold;\">' + rows[i].state_abbreviation + '</td>\n';
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
            response = response.replace("{{{STATE}}}", req.params.selected_state);
            
            
            db.all('SELECT state_name, year, coal, natural_gas, nuclear, petroleum, renewable FROM Consumption NATURAL JOIN States WHERE state_abbreviation = ? ORDER BY year', [req.params.selected_state], (err, rows) =>{
                let state_list = ['AK', 'AL', 'AR',	'AZ', 'CA',	'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA',	'ID', 'IL',	'IN', 'KS',	'KY','LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'];
                let state_name = false;
                let state_abbr = req.params.selected_state;
                for(let i = 0; i < state_list.length; i++) {
                    if(state_abbr.toLowerCase() === state_list[i].toLowerCase()) {
                        state_name = true;
                        break;
                    }
                }
                if(err || state_name === false) {
                    res.status(404).send("Error: Invalid State Name");
                } else {

                let list_items = '';
                
                let response = template.replace("{{{STATE_NAME}}}", rows[0].state_name);
                response = response.replace("{{{STATE_PIC}}}", req.params.selected_state);
                response = response.replace("{{{STATE_NAME}}}", rows[0].state_name);
                response = response.replace("{{{STATE_NAME}}}", rows[0].state_name);
                response = response.replace("{{{STATE_NAME}}}", rows[0].state_name);

                let curYearIndex = state_list.indexOf(state_abbr);
                let nextIndex = curYearIndex + 1;
    
                let prevIndex = curYearIndex - 1;

                
                if(nextIndex > 50){
                    response = response.replace("{{{NEXT_VISIBLE}}}", "hidden");
                }
                else{
                    response = response.replace("{{{NEXT_VISIBLE}}}", "visible");
                    response = response.replace("{{{NEXT_YEAR}}}", state_list[nextIndex]);
                }
    
                if(prevIndex< 0){
                    response = response.replace("{{{PREV_VISIBLE}}}", "hidden");
                }
                else{
                    response = response.replace("{{{PREV_VISIBLE}}}", "visible");
                    response = response.replace("{{{PREV_YEAR}}}", state_list[prevIndex]);
                }
                
                
                let yearlyTotalArray = '[';
                let yearlyCoal = '[';
                let yearlyNaturalGas = '[';
                let yearlyNuclear = '[';
                let yearlyPetroleum = '[';
                let yearlyRenewable = '[';
                let years = '[';


                let yearlyTotal;
                //Populating table
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

                    if(i<rows.length-1){
                        yearlyTotalArray = yearlyTotalArray + yearlyTotal + ', ';
                        yearlyCoal = yearlyCoal + rows[i].coal + ', ';
                        yearlyNaturalGas = yearlyNaturalGas + rows[i].natural_gas + ', ';
                        yearlyNuclear = yearlyNuclear + rows[i].nuclear + ', ';
                        yearlyPetroleum = yearlyPetroleum + rows[i].petroleum + ', ';
                        yearlyRenewable = yearlyRenewable + rows[i].renewable + ', ';
                        years = years + rows[i].year+ ', ';
                    }
                    else{
                        yearlyTotalArray = yearlyTotalArray + yearlyTotal + ']';
                        yearlyCoal = yearlyCoal + rows[i].coal + ']';
                        yearlyNaturalGas = yearlyNaturalGas + rows[i].natural_gas + ']';
                        yearlyNuclear = yearlyNuclear + rows[i].nuclear + ']';
                        yearlyPetroleum = yearlyPetroleum + rows[i].petroleum + ']';
                        yearlyRenewable = yearlyRenewable + rows[i].renewable + ']';
                        years = years + rows[i].year+ ']';
                    }
                }

                
                response = response.replace("{{{COAL_COUNTS}}}", yearlyCoal);
                response = response.replace("{{{NATURAL_GAS_COUNTS}}}", yearlyNaturalGas); 
                response = response.replace("{{{NUCLEAR_COUNTS}}}", yearlyNuclear);
                response = response.replace("{{{PETROLEUM_COUNTS}}}", yearlyPetroleum);
                response = response.replace("{{{RENEWABLE_COUNTS}}}", yearlyRenewable);
                response = response.replace("{{{YEARLY_TOTAL}}}", yearlyTotalArray);
                response = response.replace("{{{YEAR_ARRAY}}}", years);


                response = response.replace("{{{Table}}}", list_items);

                res.status(200).type('html').send(response);
                }
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
                let energyType_array = ['coal', 'natural_gas', 'nuclear', 'petroleum', 'renewable'];
                
                count = 0;
                for(let i = 0; i < energyType_array.length; i++) {
                    if(req.params.selected_energy_source == energyType_array[i]) {
                        count = i;
                        break;
                    }
                }
                response = response.replace("{{{ENERGY_IMAGE}}}", energyType_array[count] + ".png");
                response = response.replace("{{{E}}}", energyType_array[count]);

                let finalNext = '""';
                let finalPrev = '""';
                let visibilityNext = 'visible';
                let visibilityPrev = 'visible';
                
                if(count < 4) {
                    let next = energyType_array[count + 1];
                    finalNext = '"/energy/' + next + '"';
                } else {
                    visibilityNext = 'hidden';
                }

                if(count > 0) {
                    let prev = energyType_array[count-1];
                    finalPrev = '"/energy/' + prev + '"';
                } else {
                    visibilityPrev = 'hidden';
                }

                response = response.replace('{{{P}}}', visibilityPrev);  
                response = response.replace('{{{N}}}', visibilityNext);              
                
                response = response.replace('{{{PREV}}}', finalPrev);

                response = response.replace('{{{NEXT}}}', finalNext);

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
                    let sources = ['coal', 'natural_gas', 'nuclear', 'petroleum', 'renewable'];
                    let contains = sources.indexOf(req.params.selected_energy_source);

                    let error = false;
                    if(contains === -1){
                        error = true;
                    }

                    if(err || error){
                        res.status(404).send("Error: Invalid Energy source");
                    }
                    else {

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
