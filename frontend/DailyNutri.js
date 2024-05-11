document.addEventListener("DOMContentLoaded", (e) => {
    // Hent data over Måltider
    let mealRecords = JSON.parse(localStorage.getItem('trackedMeals'));
    let currentView = 'daily'; // Initially set to 'daily' view

    function generateMealAndDrinkTable(mealRecords) {
        // Your existing code for generating the table based on meal records
        const currentDate = new Date();
        const currentDayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
        const currentDayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);

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

        filteredMealRecords.forEach(record => {
            const recordTime = new Date(record.timeOfMeal);
            const recordHour = recordTime.getHours()
            hourlyTotals[recordHour] = (hourlyTotals[recordHour] || { water: 0, calories: 0 });
            hourlyTotals[recordHour].calories += record.nutrients ? record.nutrients.kcal || 0 : 0;
        });

        filteredDrinkRecords.forEach(record => {
            const recordTime = new Date(record.drinkTime);
            const recordHour = recordTime.getHours()
            const drinkVolume = parseFloat(record.drinkVolume || 0);
            hourlyTotals[recordHour] = (hourlyTotals[recordHour] || { water: 0, calories: 0 });
            hourlyTotals[recordHour].water += drinkVolume || 0;
        });

        for (let hour = 0; hour <= 23; hour++) {
            const row = table.insertRow();
            const cellHour = row.insertCell(0);
            const cellWater = row.insertCell(1);
            const cellCalories = row.insertCell(2);

            cellHour.textContent = `${hour}-${hour + 1}`;
            cellWater.textContent = hourlyTotals[hour] ? hourlyTotals[hour].water : 0;
            cellCalories.textContent = hourlyTotals[hour] ? hourlyTotals[hour].calories : 0;
        }
        return table;
    }

    function updateView(view) {
        const container = document.getElementById('nutrition-report-container');
        container.innerHTML = '';

        if (view === 'daily') {
            container.appendChild(generateMealAndDrinkTable(mealRecords));
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
