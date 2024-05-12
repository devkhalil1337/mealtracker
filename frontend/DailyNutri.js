document.addEventListener("DOMContentLoaded", (e) => {
    // Hent data over Måltider
    //JSON.parse(localStorage.getItem('trackedMeals'));
    var currentView = 'daily'; // Initially set to 'daily' view
    async function getMealAndDrinkTable(view) {
        const container = document.getElementById('nutrition-report-container');
        container.innerHTML = '';

        try {
            // Replace ${userId} with the actual user ID
            const userId = localStorage.getItem("loggedInUserId");
            let url = `http://localhost:3000/api/daily-nutri-calories/${userId}`;
            if (view == 'thirtyDays') {
                url = `http://localhost:3000/api/daily-nutri-calories-daywise/${userId}`;
            }
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            mealRecords = data;
            if (view == 'thirtyDays') {
                container.appendChild(generateMealAndDrinkTableMonth(mealRecords.meals, mealRecords.activities));
            } else {
                container.appendChild(generateMealAndDrinkTableDay(mealRecords.meals, mealRecords.activities));

            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }

        // Your existing code...
    }


    function generateMealAndDrinkTableMonth(mealRecords, activityRecords) {
        const currentDate = new Date();
        const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Create an object to store day-wise totals
        const dayTotals = {};

        // Initialize day-wise totals for the last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
            const formattedDate = date.toISOString().slice(0, 10); // YYYY-MM-DD format
            dayTotals[formattedDate] = { water: 0, calories: 0, caloriesBurned: 0 };
        }
        mealRecords.filter(rec => {
            rec.nutrients = JSON.parse(rec.Nutrients);
            rec.drinkDate = new Date(rec.Date).toISOString().slice(0, 10).replace('T', ' ');
            rec.drinkTime = new Date(rec.drinkDate + ' ' + rec.DrinkTime).toISOString();
            rec.drinkVolume = rec.DrinkVolume;
            return rec;
        })
        // Calculate totals for meal records
        mealRecords.forEach(record => {
            const recordDate = new Date(record.Date).toISOString().slice(0, 10).replace('T', ' ');
            if (!dayTotals[recordDate]) {
                dayTotals[recordDate] = { water: 0, calories: 0, caloriesBurned: 0 };
            }
            dayTotals[recordDate] = dayTotals[recordDate];
            dayTotals[recordDate].calories += record.nutrients ? (record.nutrients.kcal || 0) : 0;
            dayTotals[recordDate].water += parseFloat(record.drinkVolume || 0);
        });

        // Calculate totals for activity records
        activityRecords.forEach(record => {
            const recordDate = new Date(record.date).toISOString().slice(0, 10).replace('T', ' ');
            dayTotals[recordDate] = dayTotals[recordDate] || { water: 0, calories: 0, caloriesBurned: 0 };
            dayTotals[recordDate].caloriesBurned += parseFloat(record.Caloriesburned || 0);
        });

        // Create table
        const table = document.createElement('table');

        // Create table header
        const headerRow = table.insertRow();
        const headerCellDay = headerRow.insertCell(0);
        const headerCellWater = headerRow.insertCell(1);
        const headerCellCalories = headerRow.insertCell(2);
        const headerCellCaloriesBurned = headerRow.insertCell(3);

        headerCellDay.textContent = 'Day';
        headerCellWater.textContent = 'Total Water Intake (L)';
        headerCellCalories.textContent = 'Total Calories Intake';
        headerCellCaloriesBurned.textContent = 'Total Calories Burned';

        // Populate table with data
        Object.keys(dayTotals).forEach(date => {
            const row = table.insertRow();
            const cellDay = row.insertCell(0);
            const cellWater = row.insertCell(1);
            const cellCalories = row.insertCell(2);
            const cellCaloriesBurned = row.insertCell(3);

            cellDay.textContent = date;
            cellWater.textContent = dayTotals[date].water.toFixed(2);
            cellCalories.textContent = dayTotals[date].calories.toFixed(2);
            cellCaloriesBurned.textContent = dayTotals[date].caloriesBurned.toFixed(2);
        });

        return table;
    }

    function generateMealAndDrinkTableDay(mealRecords, activitRecords) {
        // Your existing code for generating the table based on meal records
        const currentDate = new Date();
        const currentDayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
        const currentDayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
        mealRecords.filter(rec => {

            rec.date = new Date(rec.Date).toISOString().slice(0, 10).replace('T', ' ');
            rec.timeOfMeal = new Date(rec.date + ' ' + rec.Time).toISOString();
            rec.drinkTime = new Date(rec.date + ' ' + rec.DrinkTime).toISOString();
            rec.drinkVolume = rec.DrinkVolume;
            rec.nutrients = JSON.parse(rec.Nutrients);
            return rec;
        })

        activitRecords.filter(rec => {

            rec.activityDateTime = new Date(rec.datetime_column).toISOString();
            return rec;
        })

        const table = document.createElement('table');

        const headerRow = table.insertRow();
        const headerCellHour = headerRow.insertCell(0);
        const headerCellWater = headerRow.insertCell(1);
        const headerCellCalories = headerRow.insertCell(2);
        const headerCellCaloriesBurned = headerRow.insertCell(3);

        headerCellHour.textContent = 'Hour';
        headerCellWater.textContent = 'Total Water Intake (L)';
        headerCellCalories.textContent = 'Total Calories Intake';
        headerCellCaloriesBurned.textContent = 'Total Calories Burned';

        const hourlyTotals = {};

        mealRecords.forEach(record => {
            const recordTime = new Date(record.timeOfMeal);
            const recordHour = recordTime.getHours()
            hourlyTotals[recordHour] = (hourlyTotals[recordHour] || { water: 0, calories: 0, caloriesburned: 0 });
            hourlyTotals[recordHour].calories += record.nutrients ? record.nutrients.kcal || 0 : 0;
        });

        mealRecords.forEach(record => {
            const recordTime = new Date(record.drinkTime);
            const recordHour = recordTime.getHours()
            const drinkVolume = parseFloat(record.drinkVolume || 0);
            hourlyTotals[recordHour] = (hourlyTotals[recordHour] || { water: 0, calories: 0, caloriesburned: 0 });
            hourlyTotals[recordHour].water += drinkVolume || 0;
        });

        activitRecords.forEach(record => {
            const recordTime = new Date(record.activityDateTime);
            const recordHour = recordTime.getHours()
            const caloriesburned = parseFloat(record.Caloriesburned || 0);
            hourlyTotals[recordHour] = (hourlyTotals[recordHour] || { water: 0, calories: 0, caloriesburned: 0 });
            hourlyTotals[recordHour].caloriesburned += caloriesburned || 0;
        });

        for (let hour = 0; hour <= 23; hour++) {
            const row = table.insertRow();
            const cellHour = row.insertCell(0);
            const cellWater = row.insertCell(1);
            const cellCalories = row.insertCell(2);
            const cellBurnCalories = row.insertCell(3);

            cellHour.textContent = `${hour}-${hour + 1}`;
            cellWater.textContent = hourlyTotals[hour] ? hourlyTotals[hour].water : 0;
            cellCalories.textContent = hourlyTotals[hour] ? hourlyTotals[hour].calories : 0;
            cellBurnCalories.textContent = hourlyTotals[hour] ? hourlyTotals[hour].caloriesburned : 0;
        }
        return table;
    }


    function updateView(view) {


        if (view === 'daily') {
            getMealAndDrinkTable(view);

        } else if (view === 'thirtyDays') {
            //logic for 30 days view
            getMealAndDrinkTable(view);

        }
    }

    document.getElementById('viewDropdown').addEventListener('change', function () {
        currentView = this.value;
        updateView(currentView);
    });

    updateView(currentView);
});
