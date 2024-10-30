import express from "express";
import API from "./API.js";
import jwt from "jsonwebtoken";

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

export const signupRoute = express.Router();
signupRoute.post("/", API.signup);

export const loginRoute = express.Router();
loginRoute.post("/", API.login);

export const removeProductRoute = express.Router();
removeProductRoute.post("/", fetchUser, API.removeProduct);/// not checked

export const getCartRoute = express.Router();
getCartRoute.post("/", fetchUser, API.getCart);

export const addToCartRoute = express.Router();
addToCartRoute.post("/", fetchUser, API.addToCart);