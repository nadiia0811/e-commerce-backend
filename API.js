import { Users } from "./models.js";
import jwt from 'jsonwebtoken';



    const signup = async (req, res) => {
        try {
            let existingUser = await Users.findOne({email: req.body.email}); 
            if(existingUser) {
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
            
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Something went wrong"});
        }
    }

    const login =  async (req, res) => {

        try{
            let user = await Users.findOne({email: req.body.email});
            if ( user ) {
               const passCompare = req.body.password === user.password;
               if( passCompare ) {
                  const data = {
                    user: {id: user.id}  
                  }
                  const token = jwt.sign(data, "secret_ecom");  
                  return res.json({
                    success: true, 
                    token
                });
            } else {
               return res.status(401).json({
                      success: false,
                      error: "Wrong password"})
            }
            } else {
           return res.status(404).json({
                success: false,
                error: "Such user doesn't exist. You need to sign up" });
            }
        } catch (err) {
           console.log(err);
           return res.status(500).json({message: "Something went wrong"})
        }     
    };
  
  const removeProduct = async (req, res) => {  
    try{
        const userData = await Users.findOne({_id: req.user.id});
        if(userData.cartData[req.body.itemId] > 0) {
          userData.cartData[req.body.itemId] -= 1;
        }
        await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
        res.send("Removed");
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Something went wrong"});
    } 
  } 

  const getCart = async (req, res) => {
    try {
        const userData = await Users.findOne({_id: req.user.id});
        res.json(userData.cartData)
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Something went wrong"});
    }   
  }

  const addToCart = async (req, res) => {
    try {
        let userData = await Users.findOne({_id: req.user.id});
        userData.cartData[req.body.itemId] += 1;
        await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
        res.send("Added");
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Something went wrong"});
    }   
  }



export default { signup,
                 login,
                 removeProduct,
                 getCart,
                 addToCart };