// Lytter til DOMContentLoaded eventet for at sikre, at hele DOM-træet er indlæst, før funktionerne kaldes.
document.addEventListener("DOMContentLoaded", function () {
  const mealTableBody = document.getElementById("meal-table-body");
  let mealsData = []
  // Beregner næringsværdier per 100g for et givet måltid.
  function calculateNutrientValuesPer100g(meal) {
    console.log(meal); // Logger det aktuelle måltid for debugging.
    // Tjekker om måltidets ingredienser er et array.
    if (!Array.isArray(meal.ingredients)) {
      console.error('Ingredients is not an array', meal); // Logger en fejl, hvis ingredienser ikke er et array.
      return { kulhydrater: 0, protein: 0, fedt: 0, vand: 0, calories: 0 }; // Returnerer nul-værdier, hvis ingredienser ikke er et array.
    }

    // Beregner det totale vægt af alle ingredienser.
    const totalWeight = meal.ingredients.reduce(
      (total, ingredient) => total + ingredient.amount,
      0
    );
    // Beregner det samlede næringsindhold for alle ingredienser.
    const totalNutrients = meal.ingredients.reduce(
      (totals, ingredient) => {
        totals.kulhydrater += (ingredient.nutrients.kulhydrater * ingredient.amount) / 100;
        totals.protein += (ingredient.nutrients.protein * ingredient.amount) / 100;
        totals.fedt += (ingredient.nutrients.fedt * ingredient.amount) / 100;
        totals.vand += (ingredient.nutrients.vand * ingredient.amount) / 100;
        totals.calories += (ingredient.nutrients.kalorier * ingredient.amount) / 100;
        return totals;
      },
      { kulhydrater: 0, protein: 0, fedt: 0, vand: 0, calories: 0 }
    );

    // Returnerer næringsværdier per 100g baseret på det totale vægt.
    return {
      kulhydrater: (totalNutrients.kulhydrater / totalWeight) * 100,
      protein: (totalNutrients.protein / totalWeight) * 100,
      fedt: (totalNutrients.fedt / totalWeight) * 100,
      vand: (totalNutrients.vand / totalWeight) * 100,
      calories: (totalNutrients.calories / totalWeight) * 100,
    };
  }
  // Viser alle måltider fra localStorage i en tabel.
  function displayMeals() {
    mealTableBody.innerHTML = "";
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
        mealsData = data
        console.log('Meals data:', mealsData);

        mealsData.forEach(meal => {
          // Beregner næringsværdier per 100g for måltidet.
          const nutrientValuesPer100g = calculateNutrientValuesPer100g(meal);
          // Opretter en ny tabelrække og fylder den med måltidsdata.
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${meal.mealName}</td>
            <td>${nutrientValuesPer100g.calories.toFixed(2)} Kcal/100g</td>
            <td>${meal.ingredients.length}</td>
            <td>${meal.ingredients.map((ingredient) => ingredient.foodName).join(', ')}</td>
            <td>N/A</td>
            <td>Carbohydrates: ${nutrientValuesPer100g.kulhydrater.toFixed(2)}g, Protein: ${nutrientValuesPer100g.protein.toFixed(2)}g, Fat: ${nutrientValuesPer100g.fedt.toFixed(2)}g, Water: ${nutrientValuesPer100g.vand.toFixed(2)}g</td>
            <td>
            <button class="remove-button" onclick="removeMeal('${meal.mealID}')">Remove</button>
            <button class="view-ingredients-button" onclick="viewIngredients('${meal.mealID}')">View Ingredients</button>
            </td>
        `;
          mealTableBody.appendChild(row); // Tilføjer rækken til tabellegemet.
        });
        // Process the meals data here (e.g., display on the UI)
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });




  }

  // Gør det muligt for brugeren at se ingredienser for et valgt måltid.
  window.viewIngredients = function (key) {
    const meal = mealsData;//JSON.parse(localStorage.getItem(key));
    // Tjekker, om måltidet har ingredienser.
    if (meal.length == 0) {
      alert('No ingredients found for this meal.'); // Viser en advarsel, hvis ingen ingredienser findes.
      return;
    }
    const selectedMeal = meal.filter(ingredient => ingredient.mealID == key)[0];
    // Opretter en streng, der viser alle ingredienserne og deres mængder.
    const ingredientsList = selectedMeal.ingredients.map(ingredient => `${ingredient.foodName} (${ingredient.amount}g)`).join('\n');
    alert(`Ingredients for ${selectedMeal.mealName}:\n${ingredientsList}`);
  };
  // Tillader brugeren at fjerne et måltid fra localStorage og opdaterer visningen
  window.removeMeal = function (key) {
    fetch(`http://localhost:3000/api/meals/${key}`, {
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
        displayMeals(); // Opdaterer måltidsvisningen.
      })
      .catch(error => {
        console.error('There was a problem with the deleting opertaion:', error);
      });


  };

  displayMeals(); // Kalder displayMeals ved indlæsning for at vise måltiderne.





});
