import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { User } from "../models/users.js";
import bcrypt from "bcrypt";

interface AuthRequest extends Request {
    user?: any;
}

// Helper to genrate JWT token
const generateToken = (id: string)=>{
    return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
}


//resister a new user
// api/auth /register
export const registerUser = async(req: Request, res: Response): Promise<void> =>{
   try{
     const { name, email, password, phone, role} = req.body;
     if(!name || !email || !password){
        res.status(400).json({message: "Please enter all required fields"})
        return;
     }

     //check if user exists
     const userExists = await User.findOne({ email });
     if(userExists){
        res.status(400).json({message: "User already exists"})
        return;
     }

     //Hash password
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(password, salt);

     //create user
        const user = await User.create({ 
            name,
            email, 
            password: hashedPassword, 
            Phone: phone,
            role });

            if(user){
                res.status(201).json({
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    Phone: user.Phone,
                    role: user.role,
                    token: generateToken(user.id.toString())
                })
            } else{
                res.status(400).json({message: "Invalid user data"});
            }
   } catch(error: any){
    console.error(error);
    res.status(400).json({message: error.message})
 }
}

//authenticate a user & get token
// api/auth /login
export const loginUser = async(req: Request, res: Response): Promise<void> =>{
   try{
     const { email, password} = req.body;
     if(!email || !password){
        res.status(400).json({message: "Please provide email and password"})
        return;
     }

        //check for user email
        const user = await User.findOne({ email });
        if(!user){
            res.status(401).json({message: "Invalid email or password"})
            return;
        }
        //Check if password matches
        const isMatch = await bcrypt.compare(password, user.password || "");
        if(!isMatch){
            res.status(401).json({message: "Invalid email or password"})
            return;
        }

        res.json({
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    Phone: user.Phone,
                    role: user.role,
                    token: generateToken(user.id.toString())
                })
   } catch(error: any){
    console.error(error);
    res.status(400).json({message: error.message})
 }
}

//get user profile
// api/auth /me
//access private
export const getMe = async(req: AuthRequest, res: Response): Promise<void> =>{
   try{
     if(!req.user){
        res.status(401).json({message: "User not found"})
        return;
     }
     res.json(req.user)
   } catch(error: any){
    console.error(error);
    res.status(400).json({message: error.message})
}
}
