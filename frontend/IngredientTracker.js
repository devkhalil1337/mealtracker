document.addEventListener("DOMContentLoaded", function () {
    const ingredientSelect = document.getElementById("ingredientSelect");
    const trackMealForm = document.getElementById("trackMealForm");
    const intakeRecordsContainer = document.querySelector(".intake-records");
    document.getElementById("registerIngredientTrackerIntakeButton").addEventListener("click", async function () {
        const mealName = ingredientSelect.options[ingredientSelect.selectedIndex].value;
        const mealWeight = document.getElementById("mealWeight").value;
        const mealDate = document.getElementById("mealDate").value;
        const mealTime = document.getElementById("mealTime").value;
        const drinkVolume = document.getElementById("drinkVolume").value;
        const drinkTime = document.getElementById("drinkTime").value;
        console.log({ mealDate })

        // Antag at vi bruger den valgte opskrift til at beregne næringsindholdet direkte
        let selectedMealData = allIngredients.find(elm => elm.foodName == mealName);
        if (!selectedMealData) {
            alert("Selected meal data not found!");
            return;
        }
        let nutrientValues = await getNutrientValues(selectedMealData.foodID, mealWeight);
        selectedMealData.nutrientValues = nutrientValues;
        const nutrients = calculateNutrients(selectedMealData, mealWeight);

        // sætter timestamp for måltid
        const [hoursOfMeal, minutesOfMeal] = mealTime.split(':');
        const currentMealDate = new Date();
        currentMealDate.setHours(parseInt(hoursOfMeal, 10));
        currentMealDate.setMinutes(parseInt(minutesOfMeal, 10));

        // sætter timestamp for drink
        const [hoursOfDrink, minutesOfDrink] = drinkTime.split(':');
        const currentDrinkDate = new Date();
        currentDrinkDate.setHours(parseInt(hoursOfDrink, 10));
        currentDrinkDate.setMinutes(parseInt(minutesOfDrink, 10));

        const mealRecord = {
            mealName: mealName,
            weight: mealWeight,
            timeOfMeal: currentMealDate,
            nutrients: nutrients,
            drinkVolume: drinkVolume,
            drinkTime: currentDrinkDate,
            time: mealTime,
            date: mealDate
        };

        const timestamp = new Date().toISOString().replace(/[-:.T]/g, "");
        const trackedMealKey = `trackedMeal-${timestamp}`;

        localStorage.setItem(trackedMealKey, JSON.stringify(mealRecord));

        // Gem tracked meals i et array
        let trackedMeals = JSON.parse(localStorage.getItem('trackedMeals'))
        if (trackedMeals) {
            trackedMeals.push(mealRecord);
            localStorage.setItem('trackedMeals', JSON.stringify(trackedMeals));
        } else {
            let trackedMeals = [mealRecord]
            localStorage.setItem('trackedMeals', JSON.stringify(trackedMeals));
        }

        displayIntakeRecords();
        trackMealForm.reset();
    });

    // Asynkron funktion til at hente næringsværdier for en bestemt ingrediens
    async function getNutrientValues(foodID, amount) {
        // Henter individuelle næringsværdier
        let carbsValue = await fetchNutritionValue(foodID, "1220");
        let proteinValue = await fetchNutritionValue(foodID, "1110");
        let fatValue = await fetchNutritionValue(foodID, "1310");
        let kcalValue = await fetchNutritionValue(foodID, "1030");
        let waterValue = await fetchNutritionValue(foodID, "1620");

        // Returnerer næringsværdier justeret for mængde
        return {
            kulhydrater: (carbsValue / 100) * amount,
            protein: (proteinValue / 100) * amount,
            fedt: (fatValue / 100) * amount,
            kalorier: (kcalValue / 100) * amount,
            vand: (waterValue / 100) * amount
        };
    };


    // Asynkron funktion til at hente næringsværdier baseret på fødevareID og sortKey
    async function fetchNutritionValue(foodID, sortKey) {
        try {
            // Laver et API-kald for at hente næringsværdier
            const response = await fetch(`https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`, {
                method: 'GET',
                headers: {
                    'X-API-Key': '168935'
                }
            });

            // Tjekker for fejl i svaret
            if (!response.ok) {
                throw new Error(`API-opkald fejlede: ${response.status}`);
            }

            // Parser svaret til JSON
            const data = await response.json();

            // Tjekker om data indeholder de ønskede værdier
            if (data.length > 0 && data[0].resVal) {
                return parseFloat(data[0].resVal); // Konverterer resultatet til et flydende tal
            } else {
                throw new Error('Næringsdata ikke fundet i svaret');
            }
        } catch (error) {
            console.error("Fejl ved hentning af næringsdata:", error);
            return 0; // Returnerer en standardværdi, justér efter behov
        }
    };


    // Funktion til at hente og vise ingredienser
    function fetchAndDisplayIngredients() {
        fetch("https://nutrimonapi.azurewebsites.net/api/FoodItems", {
            headers: {
                "X-API-Key": "168935"
            }
        })
            .then(response => response.json())
            .then(data => {
                allIngredients = data;
                allIngredients.forEach(el => {


                    const option = new Option(el.foodName, el.foodName);
                    ingredientSelect.appendChild(option);
                })
                console.log(allIngredients.slice(0, 5));
            })
            .catch(error => console.error("Error fetching data:", error));
    };

    // Udfører initial visning af ingredienser
    fetchAndDisplayIngredients();
    displayIntakeRecords();

    function calculateNutrients(mealData, weight) {
        console.log({ mealData })
        let totalNutrients = { kcal: 0, protein: 0, fat: 0, fibre: 0 };
        totalNutrients.kcal += (mealData?.nutrientValues.kalorier || 0) * weight / 100;
        totalNutrients.protein += (mealData?.nutrientValues.protein || 0) * weight / 100;
        totalNutrients.fat += (mealData?.nutrientValues.fedt || 0) * weight / 100;
        totalNutrients.fibre += (mealData?.nutrientValues.fibre || 0) * weight / 100;
        return totalNutrients;
    }

    function _calculateNutrients(mealData, weight) {
        console.log({ mealData })
        let totalNutrients = { kcal: 0, protein: 0, fat: 0, fibre: 0 };
        totalNutrients.kcal += (mealData?.nutrients.kalorier || 0) * weight / 100;
        totalNutrients.protein += (mealData?.nutrients.protein || 0) * weight / 100;
        totalNutrients.fat += (mealData?.nutrients.fedt || 0) * weight / 100;
        totalNutrients.fibre += (mealData?.nutrients.fibre || 0) * weight / 100;
        return totalNutrients;
    }

    function displayIntakeRecords() {
        intakeRecordsContainer.innerHTML = "";

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("trackedMeal-")) {
                const mealRecord = JSON.parse(localStorage.getItem(key));
                addIntakeRecordToDOM(mealRecord, key);
            }
        }
    }

    function addIntakeRecordToDOM(mealRecord, recordId) {
        const kcalValue = mealRecord.nutrients.kcal
            ? mealRecord.nutrients.kcal.toFixed(0)
            : "0";

        const recordDiv = document.createElement("div");
        recordDiv.classList.add("record");
        recordDiv.dataset.id = recordId;
        recordDiv.innerHTML = `
            <span>${mealRecord.date} - ${mealRecord.mealName} - ${mealRecord.weight}g at ${mealRecord.time}, ${kcalValue} kcal</span>
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
        `;

        const deleteButton = recordDiv.querySelector(".delete");
        deleteButton.onclick = function () { deleteRecord(recordDiv); };

        const editButton = recordDiv.querySelector(".edit");
        editButton.onclick = function () { editRecord(recordId, recordDiv); };

        intakeRecordsContainer.appendChild(recordDiv);
    }
    function deleteRecord(recordDiv) {
        const recordId = recordDiv.dataset.id;
        localStorage.removeItem(recordId);
        recordDiv.remove();
    }

    function editRecord(recordId, recordDiv) {
        const mealRecord = JSON.parse(localStorage.getItem(recordId));
        if (!mealRecord) {
            console.error("Meal record not found");
            return;
        }

        const newMealName = prompt("Edit meal name:", mealRecord.mealName);
        const newWeight = parseFloat(prompt("Edit meal weight (g):", mealRecord.weight));
        const newTime = prompt("Edit meal time:", mealRecord.time);
        const newDate = prompt("Edit meal date:", mealRecord.date);

        if (newMealName && !isNaN(newWeight) && newTime && newDate) {
            let originalMealData = JSON.parse(localStorage.getItem(newMealName)); // Antager at den originale opskrift kan hentes ved navn
            if (!originalMealData) {
                localStorage.setItem(`${mealRecord.mealName}`, JSON.stringify(newMealName))
                originalMealData = mealRecord;
            } else {
                originalMealData = mealRecord;
            }

            const newNutrients = _calculateNutrients(originalMealData, newWeight);

            mealRecord.mealName = newMealName;
            mealRecord.weight = newWeight;
            mealRecord.time = newTime;
            mealRecord.date = newDate;
            mealRecord.nutrients = newNutrients;

            localStorage.setItem(recordId, JSON.stringify(mealRecord));
            displayIntakeRecords();
        } else {
            alert("Invalid input.");
        }
    }



});

