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
            db.all('SELECT state_abbreviation, coal, natural_gas, nuclear, petroleum, renewable FROM Consumption WHERE year = ?', [req.params.selected_year], (err, rows) =>{
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
    fs.readFile(path.join(template_dir, 'state.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        res.status(200).type('html').send(template); // <-- you may need to change this
    });
});

// GET request handler for '/energy/*'
app.get('/energy/:selected_energy_source', (req, res) => {
    console.log(req.params.selected_energy_source);
    fs.readFile(path.join(template_dir, 'energy.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        res.status(200).type('html').send(template); // <-- you may need to change this
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
