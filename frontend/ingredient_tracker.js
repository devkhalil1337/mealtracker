document.addEventListener("DOMContentLoaded", function () {
    const ingredientsListElement = document.getElementById("ingredientsList");
    const selectedIngredientsElement = document.getElementById("selected-ingredients");
    const searchBox = document.getElementById("search-box");
    const searchButton = document.getElementById("search-button");
    const refreshButton = document.getElementById("refresh");
    const mealWeightInput = document.getElementById("mealWeight");  // Tilføjet input for vægten

    let allIngredients = [];
    let currentMeal = {
        name: "",  // 
        ingredients: []
    };

    //Funktion til at fetche og vise ingredienserne
    function fetchAndDisplayIngredients() {
        fetch("https://nutrimonapi.azurewebsites.net/api/FoodItems", {
            headers: {
                "X-API-Key": "168935"
            }
        })
            .then(response => response.json())
            .then(data => {
                allIngredients = data;
                console.log(allIngredients.slice(0, 5));
                renderIngredientsList(allIngredients.slice(0, 5));
            })
            .catch(error => console.error("Error fetching data:", error));
    }

    //Funktion til at render en liste af ingredienserne
    function renderIngredientsList(ingredients) {
        ingredientsListElement.innerHTML = '';
        ingredients.forEach(ingredient => {
            let listItem = document.createElement('li');
            listItem.textContent = ingredient.foodName;

            let amountInput = document.createElement('input');
            amountInput.type = 'number';
            amountInput.placeholder = 'Weight (g)';
            amountInput.className = 'ingredient-amount';
            listItem.appendChild(amountInput);

            let addButton = document.createElement('button');
            addButton.textContent = 'Add';
            addButton.onclick = function () { addIngredientToMeal(ingredient, amountInput.value); };
            listItem.appendChild(addButton);

            ingredientsListElement.appendChild(listItem);
        });
    }

    //Asynkron funktion til at tilføje et ingrediens til et måltid
    async function addIngredientToMeal(ingredient, amountStr) {
        const amount = parseFloat(amountStr);

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid weight');
            return;
        }

        let nutrientValues = await getNutrientValues(ingredient.foodID, amount);

        let listItem = document.createElement('li');
        listItem.textContent = `${ingredient.foodName} - ${amount}g, Carbs: ${nutrientValues.kulhydrater}g, Protein: ${nutrientValues.protein}g, Fat: ${nutrientValues.fedt}g, Calories: ${nutrientValues.kalorier}g, Water: ${nutrientValues.vand}g`;

        let removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = function () { listItem.remove(); };
        listItem.appendChild(removeButton);

        selectedIngredientsElement.appendChild(listItem);

        currentMeal.ingredients.push({
            foodName: ingredient.foodName,
            amount: amount,
            nutrients: nutrientValues
        });
    }

    //Asynkron funktion til at fetche nutrition values baseret på foddID og Sortkey
    async function fetchNutritionValue(foodID, sortKey) {
        try {
            const response = await fetch(`https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`, {
                method: 'GET',
                headers: {
                    'X-API-Key': '168935'
                }
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.length > 0 && data[0].resVal) {
                return parseFloat(data[0].resVal);
            } else {
                throw new Error('Nutrition data not found in the response');
            }
        } catch (error) {
            console.error("Error fetching nutrition data:", error);
            return 0;
        }
    }

    // Asynkron funktion til at få nutrient værdier for et specifikt ingrediens
    async function getNutrientValues(foodID, amount) {
        try {
            let carbsValue = await fetchNutritionValue(foodID, "1220");
            let proteinValue = await fetchNutritionValue(foodID, "1110");
            let fatValue = await fetchNutritionValue(foodID, "1310");
            let kcalValue = await fetchNutritionValue(foodID, "1030");
            let waterValue = await fetchNutritionValue(foodID, "1620");

            return {
                kulhydrater: (carbsValue / 100) * amount,
                protein: (proteinValue / 100) * amount,
                fedt: (fatValue / 100) * amount,
                kalorier: (kcalValue / 100) * amount,
                vand: (waterValue / 100) * amount
            };
        } catch (error) {
            console.error("Error getting nutrient values:", error);
            return {
                kulhydrater: 0,
                protein: 0,
                fedt: 0,
                kalorier: 0,
                vand: 0
            };
        }
    }
    // Event listener til "Save Intake" knappen
    const saveIntakeButton = document.getElementById("saveIntakeButton");
    saveIntakeButton.addEventListener("click", function () {
        if (currentMeal.ingredients.length > 0) {
            localStorage.setItem(currentMeal.name, JSON.stringify(currentMeal));
            alert("Intake saved!");
            currentMeal = { name: "", ingredients: [] };
            // Clear the selected ingredients list after saving
            selectedIngredientsElement.innerHTML = '';
        } else {
            alert("Please add at least one ingredient before saving the intake.");
        }

    });

    // funktion til at filtrerer ingredienserne baseret på søgningen
    function filterIngredients(query) {
        return allIngredients.filter(ingredient => {
            return ingredient.foodName && ingredient.foodName.toLowerCase().includes(query.toLowerCase());
        });
    }

    // Event listeners for at søge og refresh knappen
    searchButton.addEventListener("click", function (event) {
        event.preventDefault();
        const filteredIngredients = filterIngredients(searchBox.value);
        renderIngredientsList(filteredIngredients.slice(0, 5));
    });

    refreshButton.addEventListener("click", function (event) {
        event.preventDefault();
        fetchAndDisplayIngredients();
    });

    // Initial display af ingredienserne
    fetchAndDisplayIngredients();


});
