const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const dbConfig = {
    user: 'needs',
    password: 'Valdemar02',
    server: 'nutriserver87.database.windows.net',
    database: 'CBS database',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        hostNameInCertificate: '*.database.windows.net',
        loginTimeout: 30
    }
};

const app = express();

app.use(bodyParser.json());

// Create User 
app.post('/api/users', (req, res) => {
    console.log(req.body) //shows undefined
    const { username, password, email, weight, age, sex } = req.body;
    // Truncate sex to a single character
    const truncatedSex = sex.charAt(0).toLowerCase(); // Assuming 'sex' is 'male' or 'female'
    const query = `
        INSERT INTO [dbo].[User] (Username, Password, Email, Weight, Age, Sex)
        VALUES ('${username}', '${password}', '${email}', ${weight}, ${age}, '${truncatedSex}');
        SELECT SCOPE_IDENTITY() AS UserID; -- Return the ID of the newly inserted user
    `;
    sql.query(query)
        .then(result => {
            const userId = result.recordset[0].UserID; // Extract the ID of the newly inserted user
            res.json({ userId }); // Return the ID in the response
        })
        .catch(err => res.status(500).json({ error: err.message }));
});


// Read User
app.get('/api/users/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT * FROM [dbo].[User] WHERE UserID = ${userId}`;
    sql.query(query)
        .then(result => {
            if (result.recordset.length > 0) {
                res.json(result.recordset[0]);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        })
        .catch(err => res.status(500).json({ error: err.message }));
});

// Login User
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const query = `
        SELECT UserID FROM [dbo].[User] WHERE Email = '${email}' AND Password = '${password}'
    `;
    sql.query(query)
        .then(result => {
            if (result.recordset.length > 0) {
                const userId = result.recordset[0].UserID;
                res.json({ success: true, userId });
            } else {
                res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
        })
        .catch(err => res.status(500).json({ error: err.message }));
});



// Update User
app.put('/api/users/:userId', (req, res) => {
    const userId = req.params.userId;
    const { username, password, email, weight, age, sex } = req.body;
    // Truncate sex to a single character
    const truncatedSex = sex.charAt(0).toLowerCase(); // Assuming 'sex' is 'male' or 'female'
    const query = `
        UPDATE [dbo].[User]
        SET Username = '${username}', Password = '${password}', Email = '${email}', Weight = ${weight}, Age = ${age}, Sex = '${truncatedSex}'
        WHERE UserID = ${userId}
    `;
    sql.query(query)
        .then(result => res.json({ message: 'User updated successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});


// Delete User
app.delete('/api/users/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `DELETE FROM [dbo].[User] WHERE UserID = ${userId}`;
    sql.query(query)
        .then(result => res.json({ message: 'User deleted successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});


// Create Activity
app.post('/api/activities', (req, res) => {
    const { userId, activityType, caloriesBurned, time } = req.body;
    const query = `
        INSERT INTO [dbo].[ActivityTracker] (UserID, Activitytype, Caloriesburned, Time)
        VALUES (${userId}, '${activityType}', ${caloriesBurned}, '${time}')
    `;
    sql.query(query)
        .then(result => res.json({ message: 'Activity recorded successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Read Activity
app.get('/api/activities/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT * FROM [dbo].[ActivityTracker] WHERE UserID = ${userId}`;
    sql.query(query)
        .then(result => res.json(result.recordset))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Update Activity
app.put('/api/activities/:activityId', (req, res) => {
    const activityId = req.params.activityId;
    const { activityType, caloriesBurned, time } = req.body;
    const query = `
        UPDATE [dbo].[ActivityTracker]
        SET Activitytype = '${activityType}', Caloriesburned = ${caloriesBurned}, Time = '${time}'
        WHERE ActivityID = ${activityId}
    `;
    sql.query(query)
        .then(result => res.json({ message: 'Activity updated successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Delete Activity
app.delete('/api/activities/:activityId', (req, res) => {
    const activityId = req.params.activityId;
    const query = `DELETE FROM [dbo].[ActivityTracker] WHERE ActivityID = ${activityId}`;
    sql.query(query)
        .then(result => res.json({ message: 'Activity deleted successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});


// Create Daily Nutrition Record
app.post('/api/daily-nutri', (req, res) => {
    const { userId, time, energyIntake, waterIntake, caloriesBurned, calorieBalance } = req.body;
    const query = `
        INSERT INTO [dbo].[DailyNutri] (UserID, Time, Energyintake, Waterintake, Caloriesburned, Caloriebalance)
        VALUES (${userId}, '${time}', ${energyIntake}, ${waterIntake}, ${caloriesBurned}, ${calorieBalance})
    `;
    sql.query(query)
        .then(result => res.json({ message: 'Daily nutrition record created successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Read Daily Nutrition Records
app.get('/api/daily-nutri/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT * FROM [dbo].[DailyNutri] WHERE UserID = ${userId}`;
    sql.query(query)
        .then(result => res.json(result.recordset))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Update Daily Nutrition Record
app.put('/api/daily-nutri/:recordId', (req, res) => {
    const recordId = req.params.recordId;
    const { time, energyIntake, waterIntake, caloriesBurned, calorieBalance } = req.body;
    const query = `
        UPDATE [dbo].[DailyNutri]
        SET Time = '${time}', Energyintake = ${energyIntake}, Waterintake = ${waterIntake}, 
            Caloriesburned = ${caloriesBurned}, Caloriebalance = ${calorieBalance}
        WHERE RecordID = ${recordId}
    `;
    sql.query(query)
        .then(result => res.json({ message: 'Daily nutrition record updated successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Delete Daily Nutrition Record
app.delete('/api/daily-nutri/:recordId', (req, res) => {
    const recordId = req.params.recordId;
    const query = `DELETE FROM [dbo].[DailyNutri] WHERE RecordID = ${recordId}`;
    sql.query(query)
        .then(result => res.json({ message: 'Daily nutrition record deleted successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});



// Example endpoint for registering activities
app.post('/api/activities', (req, res) => {
    const { userId, activityName, caloriesBurned } = req.body;
    // Insert logic to calculate basal metabolic rate and store activity data
});

// Example endpoint for calculating basal metabolic rate
app.post('/api/basal-metabolic-rate/calculate', (req, res) => {
    const { userId, weight, age, gender } = req.body;
    // Insert logic to calculate basal metabolic rate
});


// Example endpoint to retrieve daily nutri data
app.get('/api/daily-nutri', (req, res) => {
    const { userId, date } = req.query;
    // Retrieve and format data for the specified user and date
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

sql.connect(dbConfig)
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection failed: ', err));
