const express = require('express');
const database = require('./db.ts');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

// Route to get all users
app.get("/allusers", (req, res) =>
{
    database.query("SELECT * FROM users", (err, result) =>
    {
        if(err)
        {
            console.log(err);
        }
        res.send(result);
    });
});

// Route to get the user
app.get("/get/:name", (req, res) =>
{
    const name = req.params.name;

    database.query("SELECT * FROM users WHERE name = ?", name,
        (err, result) =>
        {
            if(err)
            {
                console.log(err);
            }
            res.send(result);
        });
});

// Route for registering the user
app.post('/register', (req, res) =>
{
    const name = req.body.name;
    const password = req.body.password;

    database.query("INSERT INTO users (name, password) VALUES (?,?)", [name, password], (err, result) =>
    {
        if(err)
        {
            console.log(err);
        }
        console.log(result);
    });
});

app.get("/login/:name/:password", (req, res) =>
{
    const name = req.params.name;
    const password = req.params.password;

    database.query("SELECT * FROM users WHERE name = ? AND password = ?", [name, password],
        (err, result) =>
        {
            if(err)
            {
                res.send({ err: err });
                console.log(err);
            }
            else
            {
                if(result == "")
                {
                    res.send("Login error");
                }
                else
                {
                    res.send(result);
                }
            }
        });
});

app.get("/loadProjects/:name", (req, res) =>
{
    const name = req.params.name;


    database.query("SELECT * FROM projects WHERE public = 1 OR user = ?", [name],
        (err, result) =>
        {
            if(err)
            {
                res.send({ err: err });
                console.log(err);
            }
            else
            {
                if(result == "")
                {
                    res.send("No projects to load");
                }
                else
                {
                    res.send(result);
                }
            }
        });
});

app.post('/saveProject', (req, res) =>
{
    const user = req.body.user;
    const pio = req.body.pio;
    const javascript = req.body.javascript;
    const public = req.body.public;
    const name = req.body.name;

    database.query("INSERT INTO projects (user, pio, javascript, public, name) VALUES (?,?,?,?,?)",
        [user, pio, javascript, public, name], (err, result) =>
    {
        if(err)
        {
            console.log(err);
        }
        console.log(result);
    });
});

app.listen(PORT, () =>
{
    console.log(`Server running on port ${PORT}.`);
});
