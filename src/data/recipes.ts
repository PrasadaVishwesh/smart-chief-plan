import { Recipe } from "@/types/recipe";
import italianImage from "@/assets/recipe-italian.jpg";
import asianImage from "@/assets/recipe-asian.jpg";
import mexicanImage from "@/assets/recipe-mexican.jpg";
import indianImage from "@/assets/recipe-indian.jpg";

export const recipes: Recipe[] = [
  {
    id: "1",
    name: "Spaghetti Carbonara",
    description: "Classic Italian pasta with creamy egg sauce and crispy pancetta",
    image: italianImage,
    cuisine: "Italian",
    dietaryTags: [],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    ingredients: [
      "400g spaghetti",
      "200g pancetta",
      "4 eggs",
      "100g Parmesan cheese",
      "Black pepper",
      "Salt"
    ],
    instructions: [
      "Cook spaghetti in salted boiling water until al dente",
      "Fry pancetta until crispy",
      "Whisk eggs with grated Parmesan",
      "Drain pasta, reserve pasta water",
      "Mix hot pasta with pancetta",
      "Remove from heat, add egg mixture, toss quickly",
      "Add pasta water if needed for creaminess",
      "Season with black pepper and serve"
    ],
    nutrition: {
      calories: 520,
      protein: 25,
      carbs: 65,
      fat: 18
    }
  },
  {
    id: "2",
    name: "Vegetable Stir Fry",
    description: "Colorful Asian vegetables in savory sauce",
    image: asianImage,
    cuisine: "Asian",
    dietaryTags: ["vegetarian", "vegan"],
    prepTime: 15,
    cookTime: 10,
    servings: 3,
    ingredients: [
      "2 bell peppers",
      "1 onion",
      "200g broccoli",
      "2 carrots",
      "3 tbsp soy sauce",
      "2 tbsp sesame oil",
      "2 garlic cloves",
      "Ginger"
    ],
    instructions: [
      "Chop all vegetables into bite-sized pieces",
      "Heat oil in wok over high heat",
      "Add garlic and ginger, stir for 30 seconds",
      "Add harder vegetables first (carrots, broccoli)",
      "Stir fry for 3-4 minutes",
      "Add peppers and onions",
      "Add soy sauce and stir well",
      "Cook for 2-3 more minutes",
      "Serve hot over rice"
    ],
    nutrition: {
      calories: 180,
      protein: 6,
      carbs: 25,
      fat: 8
    }
  },
  {
    id: "3",
    name: "Fish Tacos",
    description: "Crispy fish tacos with fresh salsa and lime",
    image: mexicanImage,
    cuisine: "Mexican",
    dietaryTags: [],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    ingredients: [
      "500g white fish",
      "8 corn tortillas",
      "1 cup cabbage",
      "2 tomatoes",
      "1 lime",
      "Cilantro",
      "Sour cream",
      "Chili powder"
    ],
    instructions: [
      "Season fish with chili powder and salt",
      "Pan fry fish until crispy, about 3-4 minutes per side",
      "Warm tortillas in dry pan",
      "Shred cabbage finely",
      "Dice tomatoes",
      "Chop cilantro",
      "Assemble tacos with fish, cabbage, tomatoes",
      "Top with cilantro, sour cream, and lime juice"
    ],
    nutrition: {
      calories: 350,
      protein: 28,
      carbs: 35,
      fat: 10
    }
  },
  {
    id: "4",
    name: "Chickpea Curry",
    description: "Creamy Indian curry with aromatic spices",
    image: indianImage,
    cuisine: "Indian",
    dietaryTags: ["vegetarian", "vegan", "gluten-free"],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    ingredients: [
      "2 cans chickpeas",
      "400ml coconut milk",
      "1 onion",
      "3 garlic cloves",
      "Ginger",
      "2 tbsp curry powder",
      "1 can tomatoes",
      "Spinach"
    ],
    instructions: [
      "Dice onion and cook until soft",
      "Add minced garlic and ginger",
      "Add curry powder, cook for 1 minute",
      "Add tomatoes and coconut milk",
      "Drain and add chickpeas",
      "Simmer for 20 minutes",
      "Add spinach and cook until wilted",
      "Serve with rice or naan"
    ],
    nutrition: {
      calories: 420,
      protein: 15,
      carbs: 45,
      fat: 20
    }
  },
  {
    id: "5",
    name: "Margherita Pizza",
    description: "Classic Italian pizza with fresh mozzarella and basil",
    image: italianImage,
    cuisine: "Italian",
    dietaryTags: ["vegetarian"],
    prepTime: 90,
    cookTime: 12,
    servings: 2,
    ingredients: [
      "Pizza dough",
      "200g mozzarella",
      "Tomato sauce",
      "Fresh basil",
      "Olive oil",
      "Salt"
    ],
    instructions: [
      "Preheat oven to 250°C",
      "Roll out pizza dough",
      "Spread tomato sauce evenly",
      "Tear mozzarella and distribute",
      "Drizzle with olive oil",
      "Bake for 10-12 minutes until golden",
      "Top with fresh basil leaves",
      "Slice and serve hot"
    ],
    nutrition: {
      calories: 680,
      protein: 30,
      carbs: 75,
      fat: 28
    }
  },
  {
    id: "6",
    name: "Pad Thai",
    description: "Thai stir-fried noodles with peanuts and lime",
    image: asianImage,
    cuisine: "Asian",
    dietaryTags: ["gluten-free"],
    prepTime: 20,
    cookTime: 10,
    servings: 3,
    ingredients: [
      "200g rice noodles",
      "2 eggs",
      "100g shrimp",
      "Bean sprouts",
      "Peanuts",
      "Tamarind paste",
      "Fish sauce",
      "Lime"
    ],
    instructions: [
      "Soak rice noodles in hot water",
      "Heat oil in wok",
      "Scramble eggs, set aside",
      "Cook shrimp until pink",
      "Add drained noodles",
      "Add tamarind paste and fish sauce",
      "Toss everything together",
      "Add bean sprouts and peanuts",
      "Serve with lime wedges"
    ],
    nutrition: {
      calories: 450,
      protein: 22,
      carbs: 55,
      fat: 15
    }
  },
  {
    id: "7",
    name: "Enchiladas",
    description: "Rolled tortillas filled with chicken and covered in sauce",
    image: mexicanImage,
    cuisine: "Mexican",
    dietaryTags: ["gluten-free"],
    prepTime: 25,
    cookTime: 30,
    servings: 4,
    ingredients: [
      "8 tortillas",
      "500g chicken",
      "Enchilada sauce",
      "200g cheese",
      "Sour cream",
      "Black beans",
      "Corn"
    ],
    instructions: [
      "Cook and shred chicken",
      "Mix chicken with beans and corn",
      "Fill tortillas with mixture",
      "Roll and place in baking dish",
      "Pour enchilada sauce over top",
      "Sprinkle with cheese",
      "Bake at 180°C for 25-30 minutes",
      "Serve with sour cream"
    ],
    nutrition: {
      calories: 580,
      protein: 35,
      carbs: 48,
      fat: 25
    }
  },
  {
    id: "8",
    name: "Palak Paneer",
    description: "Indian cottage cheese in creamy spinach sauce",
    image: indianImage,
    cuisine: "Indian",
    dietaryTags: ["vegetarian", "gluten-free"],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    ingredients: [
      "300g paneer",
      "500g spinach",
      "1 onion",
      "2 tomatoes",
      "Cream",
      "Garam masala",
      "Cumin",
      "Garlic"
    ],
    instructions: [
      "Blanch spinach and blend into puree",
      "Cube paneer and lightly fry",
      "Sauté onions until golden",
      "Add garlic and spices",
      "Add chopped tomatoes, cook down",
      "Add spinach puree",
      "Simmer for 10 minutes",
      "Add paneer and cream",
      "Serve with naan or rice"
    ],
    nutrition: {
      calories: 320,
      protein: 18,
      carbs: 20,
      fat: 20
    }
  },
  {
    id: "9",
    name: "Quinoa Buddha Bowl",
    description: "Healthy bowl with quinoa, roasted vegetables, and tahini dressing",
    image: asianImage,
    cuisine: "Asian",
    dietaryTags: ["vegetarian", "vegan", "gluten-free"],
    prepTime: 15,
    cookTime: 30,
    servings: 2,
    ingredients: [
      "1 cup quinoa",
      "Sweet potato",
      "Chickpeas",
      "Kale",
      "Avocado",
      "Tahini",
      "Lemon",
      "Garlic"
    ],
    instructions: [
      "Cook quinoa according to package",
      "Roast sweet potato and chickpeas at 200°C",
      "Massage kale with lemon juice",
      "Mix tahini with water, lemon, garlic for dressing",
      "Assemble bowl with quinoa as base",
      "Add roasted vegetables and chickpeas",
      "Top with kale and avocado",
      "Drizzle with tahini dressing"
    ],
    nutrition: {
      calories: 480,
      protein: 16,
      carbs: 62,
      fat: 18
    }
  },
  {
    id: "10",
    name: "Mushroom Risotto",
    description: "Creamy Italian rice with wild mushrooms and Parmesan",
    image: italianImage,
    cuisine: "Italian",
    dietaryTags: ["vegetarian", "gluten-free"],
    prepTime: 10,
    cookTime: 35,
    servings: 4,
    ingredients: [
      "300g arborio rice",
      "400g mushrooms",
      "1L vegetable stock",
      "1 onion",
      "White wine",
      "Parmesan cheese",
      "Butter",
      "Thyme"
    ],
    instructions: [
      "Sauté onion in butter until soft",
      "Add rice, toast for 2 minutes",
      "Add wine, stir until absorbed",
      "Add warm stock one ladle at a time",
      "Stir constantly, adding more stock as absorbed",
      "Sauté mushrooms separately",
      "After 25 minutes, rice should be creamy",
      "Stir in mushrooms, Parmesan, butter",
      "Season and serve immediately"
    ],
    nutrition: {
      calories: 420,
      protein: 12,
      carbs: 68,
      fat: 12
    }
  },
  {
    id: "11",
    name: "Keto Cauliflower Pizza",
    description: "Low-carb pizza with cauliflower crust",
    image: italianImage,
    cuisine: "Italian",
    dietaryTags: ["vegetarian", "gluten-free", "keto"],
    prepTime: 20,
    cookTime: 25,
    servings: 2,
    ingredients: [
      "1 cauliflower head",
      "200g mozzarella",
      "2 eggs",
      "Parmesan",
      "Tomato sauce",
      "Pizza toppings",
      "Italian herbs"
    ],
    instructions: [
      "Rice cauliflower and microwave 5 minutes",
      "Squeeze out all water from cauliflower",
      "Mix with eggs and cheese to form dough",
      "Press into pizza shape on baking sheet",
      "Bake at 200°C for 15 minutes",
      "Add sauce and toppings",
      "Bake for 10 more minutes",
      "Slice and serve"
    ],
    nutrition: {
      calories: 320,
      protein: 28,
      carbs: 12,
      fat: 20
    }
  },
  {
    id: "12",
    name: "Dairy-Free Chocolate Mousse",
    description: "Rich chocolate mousse made with avocado",
    image: mexicanImage,
    cuisine: "Mexican",
    dietaryTags: ["vegetarian", "vegan", "gluten-free", "dairy-free"],
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    ingredients: [
      "2 ripe avocados",
      "1/4 cup cocoa powder",
      "1/4 cup maple syrup",
      "Vanilla extract",
      "Pinch of salt",
      "Coconut cream"
    ],
    instructions: [
      "Blend avocados until smooth",
      "Add cocoa powder and maple syrup",
      "Add vanilla and salt",
      "Blend until creamy",
      "Chill for 30 minutes",
      "Top with coconut cream",
      "Garnish with berries",
      "Serve cold"
    ],
    nutrition: {
      calories: 220,
      protein: 3,
      carbs: 28,
      fat: 12
    }
  }
];
