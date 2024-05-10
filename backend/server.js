const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');
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
app.use(cors({
    origin: "*"
}));

app.get('/api', (req, res) => {
    res.status(200);
});


// Create User 
app.post('/api/users', (req, res) => {
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



// Meal Creation

// Endpoint to create a new meal and meal ingredients
app.post('/api/meals', (req, res) => {
    const { userID, name, ingredients } = req.body;
    // Insert meal into Meal table
    const mealQuery = `
        INSERT INTO [dbo].[Meal] (UserID, Mealname)
        OUTPUT inserted.MealID
        VALUES (${userID}, '${name}');
    `;

    // Insert meal ingredients into MealIngredients table
    const insertIngredientsQuery = (mealID) => {
        const ingredientQueries = ingredients.map(ingredient => {
            return `
                INSERT INTO [dbo].[MealIngredients] (MealID, FoodName, Nutrients, IngredientsAmount)
                VALUES (${mealID}, '${ingredient.foodName}', '${JSON.stringify(ingredient.nutrients)}', '${ingredient.amount}');
            `;
        });
        return Promise.all(ingredientQueries.map(query => sql.query(query)));
    };

    sql.query(mealQuery)
        .then(result => {
            const mealID = result.recordset[0].MealID;
            return insertIngredientsQuery(mealID);
        })
        .then(() => {
            res.json({ message: 'Meal and meal ingredients created successfully' });
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});


// Endpoint to get meal and meal ingredients by meal ID
app.get('/api/meals/:userID/:mealID', (req, res) => {
    const mealID = req.params.mealID;
    const userId = req.params.userID;

    // Query to retrieve meal and meal ingredients
    const query = `
        SELECT Meal.*, MealIngredients.*
        FROM [dbo].[Meal]
        JOIN [dbo].[MealIngredients] ON Meal.MealID = MealIngredients.MealID
        WHERE Meal.MealID = ${mealID} and Meal.UserID = ${userId};
    `;

    // Connect to the database and execute query
    sql.query(query)
        .then(result => {
            if (result.recordset.length > 0) {
                // Group meal ingredients by meal ID
                const mealData = {
                    mealID: result.recordset[0].MealID,
                    userID: result.recordset[0].UserID,
                    mealName: result.recordset[0].Mealname,
                    mealAmount: result.recordset[0].MealAmount,
                    ingredients: result.recordset.map(row => ({
                        foodName: row.FoodName,
                        nutrients: JSON.parse(row.Nutrients),
                        amount: row.IngredientsAmount
                    }))
                };
                res.json(mealData);
            } else {
                res.status(404).json({ message: 'Meal not found' });
            }
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});


// Endpoint to get all meals and meal ingredients by user ID
app.get('/api/meals/:userID', (req, res) => {
    const userId = req.params.userID;
    console.log(userId)
    // Query to retrieve all meals and their ingredients for the given user ID
    const query = `
        SELECT Meal.*, MealIngredients.*
        FROM [dbo].[Meal]
        JOIN [dbo].[MealIngredients] ON Meal.MealID = MealIngredients.MealID
        WHERE Meal.UserID = ${userId};
    `;

    // Connect to the database and execute query
    sql.query(query)
        .then(result => {
            if (result.recordset.length > 0) {
                // Group meals and their ingredients by meal ID
                const meals = {};
                result.recordset.forEach(row => {
                    if (!meals[row.MealID]) {
                        meals[row.MealID] = {
                            mealID: row.MealID[0],
                            userID: row.UserID,
                            mealName: row.Mealname,
                            mealAmount: row.MealAmount,
                            ingredients: []
                        };
                    }
                    meals[row.MealID].ingredients.push({
                        foodName: row.FoodName,
                        nutrients: JSON.parse(row.Nutrients),
                        amount: row.IngredientsAmount
                    });
                });
                res.json(Object.values(meals)); // Send an array of meal objects
            } else {
                res.status(404).json({ message: 'No meals found for the user ID' });
            }
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});

// Import the required modules and set up your server

// Define the DELETE endpoint to remove a meal and its ingredients
app.delete('/api/meals/:mealID', (req, res) => {
    const mealID = req.params.mealID;
    console.log({ mealID })
    // Query to delete the meal from the Meal table
    const deleteMealQuery = `
        DELETE FROM [dbo].[Meal]
        WHERE MealID = ${mealID};
    `;

    // Query to delete the associated ingredients from the MealIngredients table
    const deleteIngredientsQuery = `
        DELETE FROM [dbo].[MealIngredients]
        WHERE MealID = ${mealID};
    `;

    // Execute the delete queries
    sql.query(deleteIngredientsQuery)
        .then(() => {
            // After deleting the meal, delete its associated ingredients
            return sql.query(deleteMealQuery);
        })
        .then(() => {
            // Send a success response
            res.json({ message: 'Meal and its ingredients deleted successfully' });
        })
        .catch(err => {
            // If an error occurs, send an error response
            res.status(500).json({ error: err.message });
        });
});

// Add other endpoints and start your server


// Create Activity
app.post('/api/activities', (req, res) => {
    const { userId, name, Caloriesburned, time, date } = req.body;
    const query = `
        INSERT INTO [dbo].[ActivityTracker] (UserID, name, Caloriesburned, Time,date)
        VALUES (${userId}, '${name}', ${Caloriesburned}, '${time}', '${date}')
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
    const { name, Caloriesburned, time, date } = req.body;
    const query = `
        UPDATE [dbo].[ActivityTracker]
        SET name = '${name}', Caloriesburned = ${Caloriesburned}, Time = '${time}',date = '${date}'
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

app.post('/api/mealtracker', (req, res) => {
    const { userID, mealID, weight, timeOfMeal, nutrients, drinkVolume, drinkTime, time, date } = req.body;
    console.log({ userID, })
    const query = `
        INSERT INTO MealTracker (UserID, MealID, Weight, TimeOfMeal, Nutrients, DrinkVolume, DrinkTime, Time, Date)
        VALUES (@userID, @mealID, @weight, @timeOfMeal, @nutrients, @drinkVolume, @drinkTime, @time, @date);
    `;

    const request = new sql.Request();
    request.input('UserID', sql.Int, userID);
    request.input('MealID', sql.VarChar(255), mealID);
    request.input('Weight', sql.Decimal(10, 2), weight);
    request.input('TimeOfMeal', sql.DateTime, timeOfMeal);
    request.input('Nutrients', sql.NVarChar(sql.MAX), JSON.stringify(nutrients));
    request.input('DrinkVolume', sql.Decimal(10, 2), drinkVolume);
    request.input('DrinkTime', sql.DateTime, drinkTime);
    request.input('Time', sql.VarChar(8), time);
    request.input('Date', sql.Date, date);

    request.query(query)
        .then(result => {
            res.json({ message: 'Meal Tracker record created successfully.' });
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});

//Update Meal Tracker
app.put('/api/mealtracker/:mealTrackerID', (req, res) => {
    const mealTrackerID = req.params.mealTrackerID;
    const { userID, mealID, mealName, weight, timeOfMeal, nutrients, drinkVolume, drinkTime, time, date } = req.body;

    //to update MealTracker table
    const query = `
        UPDATE MealTracker 
        SET UserID = @UserID, Weight = @Weight, TimeOfMeal = @TimeOfMeal, Nutrients = @Nutrients, 
            DrinkVolume = @DrinkVolume, DrinkTime = @DrinkTime, Time = @Time, Date = @Date
        WHERE MealTrackerID = @mealTrackerID;
    `;


    const request = new sql.Request();
    request.input('UserID', sql.Int, userID);
    // request.input('MealName', sql.VarChar(255), mealName);
    request.input('Weight', sql.Decimal(10, 2), weight);
    request.input('TimeOfMeal', sql.DateTime, timeOfMeal);
    request.input('Nutrients', sql.NVarChar(sql.MAX), nutrients);
    request.input('DrinkVolume', sql.Decimal(10, 2), drinkVolume);
    request.input('DrinkTime', sql.DateTime, drinkTime);
    request.input('Time', sql.VarChar(8), time);
    request.input('Date', sql.Date, date);
    request.input('mealTrackerID', sql.Int, mealTrackerID);

    request.query(query)
        .then(result => {
            if (result.rowsAffected[0] > 0) {
                const query = `
                UPDATE [dbo].[Meal]
                SET Mealname = '${mealName}' WHERE MealID = ${mealID} 
            `;
                sql.query(query)
                    .then(result => {
                        res.status(201).send({ message: 'Meal and Meal Tracker updated successfully' })
                        return;
                    })
                    .catch(err => res.status(500).json({ error: err.message }));

                return;
            } else {
                res.status(404).json({ message: 'Meal Tracker record not found.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});



app.get('/api/mealtracker/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT Meal.*, MealTracker.* FROM [dbo].[Meal] JOIN [dbo].[MealTracker] ON Meal.MealID = MealTracker.MealID WHERE MealTracker.UserID = ${userId};
    `;

    sql.query(query)
        .then(result => {
            if (result.recordset.length > 0) {
                console.log(result.recordset)
                const mealTrackerData = result.recordset.map(row => ({
                    mealTrackerID: row.MealTrackerID,
                    userID: row.UserID[0],
                    mealID: row.MealID[0],
                    mealName: row.Mealname,
                    weight: row.Weight,
                    TimeOfMeal: row.TimeOfMeal,
                    drinkVolume: row.DrinkVolume,
                    drinkTime: row.DrinkTime,
                    time: row.Time,
                    date: row.Date,
                    nutrients: JSON.parse(row.Nutrients),
                }))
                res.json(mealTrackerData);
            } else {
                res.status(404).json({ message: 'Meal Tracker record not found.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});

app.get('/api/mealtracker/:userID/:mealTrackerID', (req, res) => {
    const mealTrackerID = req.params.mealTrackerID;
    const userId = req.params.userID;

    const query = `
        SELECT * FROM MealTracker WHERE MealTrackerID = @mealTrackerID and UserId = @userId;
    `;

    const request = new sql.Request();
    request.input('mealTrackerID', sql.Int, mealTrackerID);
    request.input('UserId', sql.Int, userId);

    request.query(query)
        .then(result => {
            if (result.recordset.length > 0) {
                res.json(result.recordset[0]);
            } else {
                res.status(404).json({ message: 'Meal Tracker record not found.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});


app.put('/api/mealtracker/:mealTrackerID', (req, res) => {
    const mealTrackerID = req.params.mealTrackerID;
    // const { UserID, MealName, Weight, TimeOfMeal, Nutrients, DrinkVolume, DrinkTime, Time, Date } = req.body;
    const { userID, mealID, weight, timeOfMeal, nutrients, drinkVolume, drinkTime, time, date } = req.body;

    const query = `
        UPDATE MealTracker 
        SET UserID = @UserID, MealID = @mealID, Weight = @Weight, TimeOfMeal = @TimeOfMeal, Nutrients = @Nutrients, 
            DrinkVolume = @DrinkVolume, DrinkTime = @DrinkTime, Time = @Time, Date = @Date
        WHERE MealTrackerID = @mealTrackerID;
    `;

    const request = new sql.Request();
    request.input('UserID', sql.Int, userID);
    request.input('MealID', sql.Int, mealID);
    request.input('Weight', sql.Decimal(10, 2), weight);
    request.input('TimeOfMeal', sql.DateTime, timeOfMeal);
    request.input('Nutrients', sql.NVarChar(sql.MAX), nutrients);
    request.input('DrinkVolume', sql.Decimal(10, 2), drinkVolume);
    request.input('DrinkTime', sql.DateTime, drinkTime);
    request.input('Time', sql.VarChar(8), time);
    request.input('Date', sql.Date, date);
    request.input('mealTrackerID', sql.Int, mealTrackerID);

    request.query(query)
        .then(result => {
            if (result.rowsAffected[0] > 0) {
                res.json({ message: 'Meal Tracker record updated successfully.' });
            } else {
                res.status(404).json({ message: 'Meal Tracker record not found.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});


app.delete('/api/mealtracker/:mealTrackerID', (req, res) => {
    const mealTrackerID = req.params.mealTrackerID;

    const query = `
        DELETE FROM MealTracker WHERE MealTrackerID = @mealTrackerID;
    `;

    const request = new sql.Request();
    request.input('mealTrackerID', sql.Int, mealTrackerID);

    request.query(query)
        .then(result => {
            if (result.rowsAffected[0] > 0) {
                res.json({ message: 'Meal Tracker record deleted successfully.' });
            } else {
                res.status(404).json({ message: 'Meal Tracker record not found.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});



// CREATE operation - Add a new BMR record
app.post('/api/bmr', (req, res) => {
    const { userID, age, weight, datetime } = req.body;
    const query = `INSERT INTO BMR (UserID, Age, Weight, Datetime)
                   VALUES (@UserID, @Age, @Weight, @Datetime);`;
    const request = new sql.Request();
    request.input('UserID', sql.Int, userID);
    request.input('Age', sql.Int, age);
    request.input('Weight', sql.Decimal(10, 2), weight);
    request.input('Datetime', sql.DateTime, datetime);

    request.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json({ success: true });
        }
    });
});

// READ operation - Get all BMR records
app.get('/api/bmr/:userID', (req, res) => {
    const userId = req.params.userID;
    const query = `SELECT * FROM BMR where UserID = ${userId};`;
    sql.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.status(200).json(result.recordset);
        }
    });
});

// UPDATE operation - Update a BMR record
app.put('/api/bmr/:id', (req, res) => {
    const { userID, age, weight, datetime } = req.body;
    const { id } = req.params;
    const query = `UPDATE BMR SET UserID = @UserID, Age = @Age, Weight = @Weight, Datetime = @Datetime
                   WHERE BMRID = @BMRID;`;
    const request = new sql.Request();
    request.input('BMRID', sql.Int, id);
    request.input('UserID', sql.Int, userID);
    request.input('Age', sql.Int, age);
    request.input('Weight', sql.Decimal(10, 2), weight);
    request.input('Datetime', sql.DateTime, datetime);

    request.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.status(200).send('BMR record updated successfully');
        }
    });
});

// DELETE operation - Delete a BMR record
app.delete('/api/bmr/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM BMR WHERE BMRID = @BMRID;`;
    const request = new sql.Request();
    request.input('BMRID', sql.Int, id);

    request.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.status(200).send('BMR record deleted successfully');
        }
    });
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
