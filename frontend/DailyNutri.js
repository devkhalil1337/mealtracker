document.addEventListener("DOMContentLoaded", (e) => {
    // Hent data over Måltider
    let mealRecords = []

    //JSON.parse(localStorage.getItem('trackedMeals'));
    let currentView = 'daily'; // Initially set to 'daily' view


    const userId = localStorage.getItem("loggedInUserId");


    fetch(`http://localhost:3000/api/mealIngredientTracker/${userId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            IngredientTracker = data;
            console.log('displayIngredientTracker  data:', IngredientTracker);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

    async function getMealAndDrinkTable(mealRecords) {
        const container = document.getElementById('nutrition-report-container');
        container.innerHTML = '';

        try {
            // Replace ${userId} with the actual user ID
            const userId = localStorage.getItem("loggedInUserId");

            const response = await fetch(`http://localhost:3000/api/daily-nutri-calories/${userId}`, {
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
            container.appendChild(generateMealAndDrinkTable(mealRecords.meals, mealRecords.activities));
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }

        // Your existing code...
    }


    function generateMealAndDrinkTable(mealRecords, activitRecords) {
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
            console.log(rec.timeOfMeal)
            return rec;
        })

        activitRecords.filter(rec => {

            rec.activityDateTime = new Date(rec.datetime_column).toISOString();
            console.log(rec.activityDateTime)
            return rec;
        })

        const filteredMealRecords = mealRecords.filter(record => {
            const recordTime = new Date(record.timeOfMeal);
            return recordTime >= currentDayStart && recordTime <= currentDayEnd;
        });

        const filteredDrinkRecords = mealRecords.filter(record => {
            const recordTime = new Date(record.drinkTime);
            return recordTime >= currentDayStart && recordTime <= currentDayEnd;
        });

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
            console.log(record.Caloriesburned)
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
            getMealAndDrinkTable();

        } else if (view === 'thirtyDays') {
            //logic for 30 days view

        }
    }

    document.getElementById('viewDropdown').addEventListener('change', function () {
        currentView = this.value;
        updateView(currentView);
    });

    updateView(currentView);
});
