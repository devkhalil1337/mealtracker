// Lytter til DOMContentLoaded eventet for at sikre, at hele DOM-træet er indlæst, før funktionerne kaldes.
document.addEventListener("DOMContentLoaded", function () {
  populateRecipeSelect(); // Opdaterer dropdown-menuen med opskrifter fra localStorage.
  displayIntakeRecords(); // Viser sporede måltider fra localStorage.
});

// Få referencer til DOM-elementer for senere brug
const trackMealForm = document.getElementById("trackMealForm");
const intakeRecordsContainer = document.querySelector(".intake-records");
const recipeSelect = document.getElementById("recipeSelect");

// Fylder dropdown-menuen med opskrifter gemt i localStorage.
function populateRecipeSelect() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Tjekker om nøglen ikke er en sporet måltidsnøgle.
    if (!key.startsWith("trackedMeal-")) {
      try {
        const meal = JSON.parse(localStorage.getItem(key));
        // Sikrer at måltidet har et navn før det tilføjes som en mulighed.
        if (meal && meal.name) {
          const option = new Option(meal.name, meal.name);
          recipeSelect.appendChild(option);
        }
      } catch (e) {
        console.error("Error parsing meal data from localStorage:", e);
      }
    }
  }
}
// Viser sporede måltider fra localStorage.
function displayIntakeRecords() {
  intakeRecordsContainer.innerHTML = ""; // Rydder containeren før ny tilføjelse.

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Tjekker kun efter sporede måltider baseret på nøglepræfikset.
    if (key.startsWith("trackedMeal-")) {
      const mealRecord = JSON.parse(localStorage.getItem(key));
      addIntakeRecordToDOM(mealRecord, key);
    }
  }
}

function addIntakeRecordToDOM(mealRecord, recordId) {
  // Tilføjer et sporet måltid til DOM'en.
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

// Lytter til klik på registreringsknappen og behandler indtastningen.
document.getElementById("registerIntakeButton").addEventListener("click", function () {
  const mealName = recipeSelect.options[recipeSelect.selectedIndex].value;
  const mealWeight = document.getElementById("mealWeight").value;
  const mealTime = document.getElementById("mealTime").value;
  const mealDate = document.getElementById("mealDate").value;
  const drinkVolume = document.getElementById("drinkVolume").value;
  const drinkTime = document.getElementById("drinkTime").value;

  // Antag at vi bruger den valgte opskrift til at beregne næringsindholdet direkte
  const selectedMealData = JSON.parse(localStorage.getItem(mealName)); // Dette antager, at opskriftens nøgle er dens navn
  if (!selectedMealData) {
    alert("Selected meal data not found!");
    return;
  }

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
// Sletter et sporet måltid fra localStorage og DOM'en.
function deleteRecord(recordDiv) {
  const recordId = recordDiv.dataset.id;
  localStorage.removeItem(recordId);
  recordDiv.remove();
}
// Tillader redigering af et sporet måltid og opdaterer både localStorage og DOM'en.
function editRecord(recordId, recordDiv) {
  const mealRecord = JSON.parse(localStorage.getItem(recordId));
  // Redigeringslogik her, inklusive opdatering af måltidsdata og genvisning.
  if (!mealRecord) {
    console.error("Meal record not found");
    return;
  }

  const newMealName = prompt("Edit meal name:", mealRecord.mealName);
  const newWeight = parseFloat(prompt("Edit meal weight (g):", mealRecord.weight));
  const newTime = prompt("Edit meal time:", mealRecord.time);
  const newDate = prompt("Edit meal date:", mealRecord.date);

  if (newMealName && !isNaN(newWeight) && newTime && newDate) {
    const originalMealData = JSON.parse(localStorage.getItem(newMealName)); // Antager at den originale opskrift kan hentes ved navn
    if (!originalMealData) {
      console.error("Original meal data not found");
      return;
    }

    const newNutrients = calculateNutrients(originalMealData, newWeight);

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
// Beregner næringsindholdet for et måltid baseret på vægt og ingrediensdata.
function calculateNutrients(mealData, weight) {
  // Initialiserer et objekt til at holde det samlede næringsindhold.
  let totalNutrients = { kcal: 0, protein: 0, fat: 0, fibre: 0 };
  // Løber igennem hver ingrediens og opdaterer det samlede næringsindhold baseret på vægten af måltidet.
  mealData.ingredients.forEach((ingredient) => {
    totalNutrients.kcal += (ingredient.nutrients.kalorier || 0) * weight / 100;
    totalNutrients.protein += (ingredient.nutrients.protein || 0) * weight / 100;
    totalNutrients.fat += (ingredient.nutrients.fedt || 0) * weight / 100;
    totalNutrients.fibre += (ingredient.nutrients.fibre || 0) * weight / 100;
  });
  return totalNutrients;
}