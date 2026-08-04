
import { Request,Response } from "express";

import { Restaurant } from "../models/Restaurant.js";
import { v2 as cloudinary } from "cloudinary";
import { Booking } from "../models/Booking.js";

// helper function to handle image upload to cloudinary
const uploadImageToCloudinary = (fileBuffer: Buffer): Promise<{secure_url: string}> => {
   return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({folder: "QuickDine"}, (error, result) => {
         if(error){
            reject(error);
         }if(!result) return reject(new Error("Upload failed"))
            resolve({secure_url: result.secure_url})
      })
      stream.end(fileBuffer)
   })
}

// get owner's restaurant
// get /api/owner/restaurant

export const getOwnerRestaurant = async (req: Request, res: Response): Promise<void> => {
   try{
      const restaurant = await Restaurant.findOne({ owner: req.user?._id });
      if(!restaurant){
        res.status(200).json(null);
        return;
      }
      res.json(restaurant);
   }catch(error: any){
    console.error(error);
    res.status(400).json({message: error.message})
   }
}


// create owner's restaurant (submitted to pending approval)
// post /api/owner/restaurant

export const createOwnerRestaurant = async (req: Request, res: Response): Promise<void> => {
   try{
      const existing = await Restaurant.findOne({ owner: req.user?._id });
        if(existing){
            res.status(400).json({ message: "You already have a restaurant registered." });
            return;
        }
        const { name, description, cuisine, priceRange, location, address, chef, tags, availableSlots, totalSlots } = req.body;

        if(!name || !description || !cuisine || !priceRange || !location || !address || !chef){
            res.status(400).json({ message: "Please provide all required fields." });
            return;
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const slugExists = await Restaurant.findOne({ slug });
        if(slugExists){
            res.status(400).json({ message: "A restaurant with this name already exists." });
            return;
        }
        
        //Handle image upload if provided
        let imageUrl = " ";
        if(req.file){
            const Result = await uploadImageToCloudinary(req.file.buffer);
            imageUrl = Result.secure_url;
         }
        //Setup prased tags and slots
        const parsedTags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags || [];
        const parsedSlots = typeof availableSlots === "string" ? availableSlots.split(",").map((s) => s.trim()) : availableSlots || ["17:00", "18:00", "19:00", "20:00", "21:00"];

        const restaurant = await Restaurant.create({
         name,
         slug,
         description,
         cuisine,   
         priceRange,
         location,
         address,
         chef,
         image: imageUrl,
         tags: parsedTags,
         availableSlots: parsedSlots,
         totalSeats: totalSlots ? Number(totalSlots) : 20,
         owner: req.user?._id,
         status: "pending" 
             
        })

        res.status(201).json(restaurant);

   }catch(error: any){
    console.error(error);
    res.status(400).json({message: error.message})
   }
}
//update owner's restaurant 
// put /api/owner/restaurant

export const updateOwnerRestaurant = async (req: Request, res: Response): Promise<void> => {
   try{
      
      const restaurant = await Restaurant.findOne({ owner: req.user?._id })
      if(!restaurant){
         res.status(404).json({ message: "Restaurant not found." });
         return;
      }
      const { name, description, cuisine, priceRange, location, address, chef, tags, availableSlots, totalSlots } = req.body;

      if(name) restaurant.name = name;
      if(description) restaurant.description = description;
      if(cuisine) restaurant.cuisine = cuisine;
      if(priceRange) restaurant.priceRange = priceRange;
      if(location) restaurant.location = location;
      if(address) restaurant.address = address;
      if(chef) restaurant.chef = chef;
      if(totalSlots) restaurant.totalSeats = Number(totalSlots);

      if(tags){
         restaurant.tags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags;
      }
      if(availableSlots){
         restaurant.availableSlots = typeof availableSlots === "string" ? availableSlots.split(",").map((s) => s.trim()) : availableSlots;
      }
      //Handle new image upload if provided
      if(req.file){
         const Result = await uploadImageToCloudinary(req.file.buffer);
         restaurant.image = Result.secure_url;
      }
      
      const updated = await restaurant.save();
      res.json(updated);

   }catch(error: any){
    console.error(error);
    res.status(400).json({message: error.message})
   }
}

// get booking for owner's restaurant 
// get /api/owner/restaurant

export const getOwnerBookings = async (req: Request, res: Response): Promise<void> => {
   try{
     const restaurant =await Restaurant.findOne({ owner: req.user?._id });
     if(!restaurant){
      res.status(404).json({ message: "Restaurant not found." });
      return;
     }

     const bookings =await Booking.find({ restaurant: restaurant._id }).populate("user", "name email").sort({ date: -1, time: -1 });
     res.json(bookings);
   }catch(error: any){
    console.error(error);
    res.status(400).json({message: error.message})
   }
}

// update status of a booking
// put /api/owner/booking/:bookingId

export const UpdateBookingStatus = async (req: Request, res: Response): Promise<void> => {
   try{
     const { status } = req.body;
     if(!status || !["confirmed", "cancelled", "completed"].includes(status)){
      res.status(400).json({ message: "Please enter a valid booking status." });
      return;
     }
     const booking = await Booking.findById(req.params.id)
       if(!booking){
         res.status(404).json({ message: "Booking not found." });
         return;
       }

       //verify bookindg belongs to owner's restaurant
       const restaurant = await Restaurant.findById(booking.resturant)
       if(!restaurant || restaurant.owner.toString() !== req.user?._id.toString()){
         res.status(403).json({ message: "Not authorized to manage this booking." });
         return;
       }

       booking.status = status;
       await booking.save();
       res.json(booking);
   }catch(error: any){
    console.error(error);
    res.status(400).json({message: error.message})
   }
}