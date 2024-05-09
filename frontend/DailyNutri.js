document.addEventListener("DOMContentLoaded", (e) => {
    // Hent data over Måltider
    let mealRecords = JSON.parse(localStorage.getItem('trackedMeals'));

    function generateMealAndDrinkTable(mealRecords) {
        // Får start og sluttidspunkt for nuværende date
        const currentDate = new Date();
        const currentDayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
        const currentDayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);

        // Filtrerer mad fra, der ikke er indtaget inden for det seneste døgn
        const filteredMealRecords = mealRecords.filter(record => {
            const recordTime = new Date(record.timeOfMeal);
            return recordTime >= currentDayStart && recordTime <= currentDayEnd;
        });

        // filtrerer drikkevarer fra, der ikke er indtaget inden for det seneste døgn
        const filteredDrinkRecords = mealRecords.filter(record => {
            const recordTime = new Date(record.drinkTime);
            return recordTime >= currentDayStart && recordTime <= currentDayEnd;
        });

        const table = document.createElement('table');

        // laver table headers og indsætter navne
        const headerRow = table.insertRow();
        const headerCellHour = headerRow.insertCell(0);
        const headerCellWater = headerRow.insertCell(1);
        const headerCellCalories = headerRow.insertCell(2);

        headerCellHour.textContent = 'Hour';
        headerCellWater.textContent = 'Total Water Intake (L)';
        headerCellCalories.textContent = 'Total Calories';

        // laver et objekt der opbevarer total antal kalorier og liter pr. time
        const hourlyTotals = {};

        // Først fylder vi table med data fra vores måltider
        filteredMealRecords.forEach(record => {
            // får tidspunkter for måltidet
            const recordTime = new Date(record.timeOfMeal);
            const recordHour = recordTime.getHours()

            // Der bliver lavet et objekt i hourlytotals for tidspunktet. Hvis dette objekt allerede findes forbliver det det samme.
            // Ellers bliver det lavet til { water: 0, calories: 0 }. Dette er nødvendigt for at kunne tilføje nye key-value pairs
            hourlyTotals[recordHour] = (hourlyTotals[recordHour] || { water: 0, calories: 0 });
            // Hvis der findes kalorier i måltidet, bliver det lagt til den totale mængder kalorier for den gældende time. Ellers bliver de sat lig med 0
            hourlyTotals[recordHour].calories += record.nutrients ? record.nutrients.kcal || 0 : 0;
        });

        filteredDrinkRecords.forEach(record => {
            const recordTime = new Date(record.drinkTime);
            const recordHour = recordTime.getHours()

            // Drinkvloume blev registreret som en string, og kunne derfor ikke lægges sammen. Dette parser stringen som et tal
            const drinkVolume = parseFloat(record.drinkVolume || 0);

            // Samme frengangsmåde, som ved måltider
            hourlyTotals[recordHour] = (hourlyTotals[recordHour] || { water: 0, calories: 0 });
            hourlyTotals[recordHour].water += drinkVolume || 0;
        });

        // Laver et row for hver time i døgnet
        for (let hour = 0; hour <= 23; hour++) {
            const row = table.insertRow();
            const cellHour = row.insertCell(0);
            const cellWater = row.insertCell(1);
            const cellCalories = row.insertCell(2);

            cellHour.textContent = `${hour}-${hour + 1}`;
            // Hvis der findes information for den gældende time, bliver vandmængden sat ind i rækken
            cellWater.textContent = hourlyTotals[hour] ? hourlyTotals[hour].water : 0;
            // Hvis der findes information for den gældende time, bliver kaloriemængden sat ind i rækken
            cellCalories.textContent = hourlyTotals[hour] ? hourlyTotals[hour].calories : 0;
        }
        return table;
    }

   
    document.body.appendChild(generateMealAndDrinkTable(mealRecords));
});

