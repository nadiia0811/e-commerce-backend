const port = 4000;
require("dotenv").config();

const express = require("express"); 
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");


app.use(express.json());
app.use(cors()); 
  
mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
        .then(() => console.log('Database connected successfully'))
        .catch((err) => console.error('Database connection error:', err));
 
//API creation
app.get("/", (req, res) =>{
    res.send("Express App is running");
});

//Schema for User 
const Users = mongoose.model('Users', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});


//Creating endpoint for registering the user
app.post('/signup', async (req, res) => {
   let check = await Users.findOne({email: req.body.email}); 
   if(check) {
    return res.status(400).json({success: false, error: 'existing user found with same email address'})
   }
   let cart = {};
   for (let i = 1; i <= 36 ; i++) {
    cart[i] = 0;  
   }

   const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
   });

   await user.save();

   const data = {
     user: {
        id: user.id
     }
   };

   const token = jwt.sign(data, "secret_ecom");
   res.json({
    success: true,
    token
   });
});


//creating endpoint for user login
app.post("/login", async (req, res) => {
  
  let user = await Users.findOne({email: req.body.email});
  if( user ) {
    const passCompare = req.body.password === user.password;
    if( passCompare ) {
        const data = {
            user: {id: user.id}
        };
        const token = jwt.sign(data, "secret_ecom");
        res.json({
            success: true, 
            token
        });
    } else {
        res.json({
            success: false,
            error: "Wrong password"})
    }
  } else {
    res.json({
        succes: false,
        error: "Such user doesn't exist. You need to sign up" });
  }
})


//Image Storage Engine
const storage = multer.diskStorage({                                    
    destination: './upload/images',
    filename: (req, file, cb)=> {
       return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
}); 
const upload = multer({storage: storage});

//creating upload endpoint for images 
app.use('/images', express.static(path.join(__dirname, 'upload/images')));

app.post("/upload", upload.single('product'), (req, res) => { 
    res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
   })
}); 


//Schema for creating products
const Product = mongoose.model("Product", { 
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    }
});


//API for adding product to database
 app.post('/addproduct', async (req, res) => { 
  let products = await Product.find({}); 
  let id; 
  if(products.length > 0) { 
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id+1;
  } else { 
    id = 1;
  }
  const product = new Product({
    id: id,  
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  
  await product.save();  
  console.log("Saved!");

  res.json({  
    success: true,
    name: req.body.name,
  })
}); 


//API for deleting products
 app.post('/removeproduct', async (req, res) => {   
    await Product.findOneAndDelete({id: req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    })
}); 


//Creating endpoint for new collection data
 app.get('/newcollection', async (req, res) => {
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


 //creating middleware to fetch user
 const fetchUser = async (req, res, next) => {
    const token = req.header("auth-token");
    if(!token){
        res.status(401).send({error: "Please authenticate using a valid token"})
    } else {
        try {
            const data = jwt.verify(token, "secret_ecom");
            req.user = data.user;  
            next();
        } catch (error) {
           res.status(401).send({error: "Please authenticate using a valid token"});         
        }
    }
  };


//creaing endpoint to adding products to cart
 app.post("/addtocart", fetchUser, async (req, res) => {
    let userData = await Users.findOne({_id: req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    res.send("Added");
}); 


//creating endpoint to remove product from cart
 app.post("/removefromcart", fetchUser, async (req, res) => {
  const userData = await Users.findOne({_id: req.user.id});
  if(userData.cartData[req.body.itemId] > 0) {
    userData.cartData[req.body.itemId] -= 1;
  }
  await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
  res.send("Removed");
}); 


//creating endpoint to get cartdata
 app.post("/getcart", fetchUser, async (req, res) => {
    const userData = await Users.findOne({_id: req.user.id});
    res.json(userData.cartData)
}) 


//Creating API for getting all products
 app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All products fetched");
    res.send(products);
}); 

app.listen(port, (error) => {
    if(!error) {
        console.log("Server running on port: " + port);
    } else {
        console.log("Error" + error);
    }
});