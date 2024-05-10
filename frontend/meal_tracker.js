// Lytter til DOMContentLoaded eventet for at sikre, at hele DOM-træet er indlæst, før funktionerne kaldes.
var mealData = []
var mealTracker = []
document.addEventListener("DOMContentLoaded", function () {
  populateRecipeSelect(); // Opdaterer dropdown-menuen med opskrifter fra localStorage.
});

// Få referencer til DOM-elementer for senere brug
const trackMealForm = document.getElementById("trackMealForm");
const intakeRecordsContainer = document.querySelector(".intake-records");
const recipeSelect = document.getElementById("recipeSelect");

// Fylder dropdown-menuen med opskrifter gemt i localStorage.
function populateRecipeSelect() {

  // Replace ${userId} with the actual user ID
  const userId = localStorage.getItem("loggedInUserId");

  fetch(`http://localhost:3000/api/meals/${userId}`, {
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
      mealData = data;
      console.log('Recipe data:', mealData);
      displayIntakeRecords(); // Viser sporede måltider fra localStorage.
      mealData.forEach(meal => {
        // Sikrer at måltidet har et navn før det tilføjes som en mulighed.
        if (meal && meal.mealName) {
          const option = new Option(meal.mealName, meal.mealID);
          //          recipeSelect.id = meal.mealID;
          recipeSelect.appendChild(option);
        }
      });
      // Process the meals data here (e.g., display on the UI)
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
}
// Viser sporede måltider fra localStorage.
function displayIntakeRecords() {
  intakeRecordsContainer.innerHTML = ""; // Rydder containeren før ny tilføjelse.

  // Replace ${userId} with the actual user ID
  const userId = localStorage.getItem("loggedInUserId");

  fetch(`http://localhost:3000/api/mealtracker/${userId}`, {
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
      mealTracker = data;
      console.log('meal Tracker data:', mealTracker);
      mealTracker.forEach(meal => {
        addIntakeRecordToDOM(meal, meal.mealTrackerID, meal.mealID);
      });

    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });



  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Tjekker kun efter sporede måltider baseret på nøglepræfikset.
    if (key.startsWith("trackedMeal-")) {
      const mealRecord = JSON.parse(localStorage.getItem(key));
      //      addIntakeRecordToDOM(mealRecord, key);
    }
  }
  console.log(mealData)
}

function addIntakeRecordToDOM(mealRecord, recordId, mealId) {
  // Tilføjer et sporet måltid til DOM'en.
  const kcalValue = mealRecord.nutrients.kcal
    ? mealRecord.nutrients.kcal.toFixed(0)
    : "0";
  const selectedMeal = mealData.find(meal => meal.mealID == mealId);

  const recordDiv = document.createElement("div");
  recordDiv.classList.add("record");
  recordDiv.dataset.id = recordId;
  recordDiv.innerHTML = `
      <span>${mealRecord.date} - ${selectedMeal.mealName} - ${mealRecord.weight}g at ${mealRecord.time}, ${kcalValue} kcal</span>
      <button class="edit">Edit</button>
      <button class="delete" onClick=deleteMealTracker('${recordId}')>Delete</button>
  `;

  const deleteButton = recordDiv.querySelector(".delete");
  deleteButton.onclick = function () { deleteRecord(recordDiv, recordId); };

  const editButton = recordDiv.querySelector(".edit");
  editButton.onclick = function () { editRecord(recordId, recordDiv); };

  intakeRecordsContainer.appendChild(recordDiv);
}


// Lytter til klik på registreringsknappen og behandler indtastningen.
document.getElementById("registerIntakeButton").addEventListener("click", function () {
  const mealID = recipeSelect.options[recipeSelect.selectedIndex].value;
  const mealWeight = document.getElementById("mealWeight").value;
  const mealTime = document.getElementById("mealTime").value;
  const mealDate = document.getElementById("mealDate").value;
  const drinkVolume = document.getElementById("drinkVolume").value;
  const drinkTime = document.getElementById("drinkTime").value;

  // Antag at vi bruger den valgte opskrift til at beregne næringsindholdet direkte
  debugger
  const selectedMealData = mealData.find(meal => meal.mealID == mealID)//JSON.parse(localStorage.getItem(mealName)); // Dette antager, at opskriftens nøgle er dens navn
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
  const userId = localStorage.getItem("loggedInUserId");

  const mealRecord = {
    mealID: String(selectedMealData.mealID),
    mealName: selectedMealData.mealName,
    weight: mealWeight,
    timeOfMeal: currentMealDate,
    nutrients: nutrients,
    drinkVolume: drinkVolume,
    drinkTime: currentDrinkDate,
    time: mealTime,
    date: mealDate,
    userID: userId
  };
  console.log(mealRecord)
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
  addMealTracker(mealRecord, "POST")


  trackMealForm.reset();


});

function addMealTracker(mealtrackerObj, type) {
  let url = `http://localhost:3000/api/mealtracker`;
  if (mealtrackerObj.mealTrackerID) {
    url += `/${mealtrackerObj.mealTrackerID}`
  }
  fetch(url, {
    method: type,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mealtrackerObj)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log("back", data)
      setTimeout(displayIntakeRecords, 1000);
      // Process the meals data here (e.g., display on the UI)
    })
    .catch(error => {
      console.error('There was a problem with adding meal:', error);
    });

}

// Sletter et sporet måltid fra localStorage og DOM'en.
function deleteRecord(recordDiv, mealRecordId) {
  const recordId = recordDiv.dataset.id;
  localStorage.removeItem(recordId);
  recordDiv.remove();

  fetch(`http://localhost:3000/api/mealtracker/${mealRecordId}`, {
    method: 'DELETE',
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
    })
    .catch(error => {
      console.error('There was a problem with the deleting opertaion:', error);
    });
}
// Tillader redigering af et sporet måltid og opdaterer både localStorage og DOM'en.
function editRecord(recordId, recordDiv) {
  const mealTrackerRecord = mealTracker.find(mealTrck => mealTrck.mealTrackerID == recordId);//JSON.parse(localStorage.getItem(recordId));
  const mealRecord = mealData.find(mealTrck => mealTrck.mealID == mealTrackerRecord.mealID);//JSON.parse(localStorage.getItem(recordId));
  // Redigeringslogik her, inklusive opdatering af måltidsdata og genvisning.
  if (!mealTrackerRecord) {
    console.error("Meal record not found");
    return;
  }

  const newMealName = prompt("Edit meal name:", mealTrackerRecord.mealName);
  const newWeight = parseFloat(prompt("Edit meal weight (g):", mealTrackerRecord.weight));
  const newTime = prompt("Edit meal time:", mealTrackerRecord.time);
  const newDate = prompt("Edit meal date:", mealTrackerRecord.date);

  if (newMealName && !isNaN(newWeight) && newTime && newDate) {
    // const originalMealData = JSON.parse(localStorage.getItem(newMealName)); // Antager at den originale opskrift kan hentes ved navn
    // if (!originalMealData) {
    //   console.error("Original meal data not found");
    //   return;
    // }

    const newNutrients = calculateNutrients(mealRecord, newWeight);
    mealTrackerRecord.mealID = String(mealTrackerRecord.mealID);
    mealTrackerRecord.mealName = newMealName;
    mealTrackerRecord.weight = newWeight;
    mealTrackerRecord.time = newTime;
    mealTrackerRecord.date = newDate;
    mealTrackerRecord.nutrients = JSON.stringify(newNutrients);

    localStorage.setItem(recordId, JSON.stringify(mealTrackerRecord));
    setTimeout(addMealTracker(mealTrackerRecord, "PUT"), 1000)

    //    displayIntakeRecords();
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