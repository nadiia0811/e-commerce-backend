import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Users, Product } from "./models.js";
import { signupRoute, 
         loginRoute, 
         removeProductRoute,
         getCartRoute,
         addToCartRoute } from "./routes.js";
import "dotenv/config";


const port = 4000;
const app = express();


app.use(express.json());
app.use(cors()); 
  
mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
        .then(() => console.log("Database connected successfully"))
        .catch((err) => console.error("Database connection error:", err));
 
//API creation
app.get("/", (req, res) =>{
    res.send("Express App is running");
});

app.use("/signup", signupRoute)
app.use("/login", loginRoute);
app.use("/removefromcart", removeProductRoute);
app.use("/addtocart", addToCartRoute);
app.use("/getcart", getCartRoute);


//Creating endpoint for new collection data
 app.get("/newcollection", async (req, res) => {
    const products = await Product.find({});
    const newCollection = products.slice(1, 4).concat(products.slice(13, 16)).concat(products.slice(23, 25))
    console.log("New collection fetched");
    res.send(newCollection);
}); 


//Creating endpoint to sort the data
 app.post("/sort", async (req, res) => {
    const products = await Product.find({category: req.body.category})
                                  .sort({new_price: 1});
 
    res.send(products);
}) 


//Endpoint to popular in women
 app.get("/popular", async (req, res) => {
    let result = await Product.find({category: "woman"});
    let popular = result.slice(0, 4);
    console.log("Popular fetched")
    res.send(popular);
}); 


//Creating API for getting all products
 app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All products fetched");
    res.send(products);
}); 

app.listen(port, (error) => {
    if(!error) {
        console.log("Server is running on port: " + port);
    } else {
        console.log("Error: " + error);
    }
});